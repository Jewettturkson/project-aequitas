const express = require('express');
const { z } = require('zod');
const pool = require('../config/pool');
const { createIpRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const INTELLIGENCE_URL = (
  process.env.INTELLIGENCE_URL || 'http://localhost:8001'
).replace(/\/$/, '');
const INTELLIGENCE_TIMEOUT_MS = Number(
  process.env.INTELLIGENCE_TIMEOUT_MS || 4500
);
const INTELLIGENCE_SERVICE_TOKEN = process.env.INTELLIGENCE_SERVICE_TOKEN || '';
const VOLUNTEER_RATE_LIMIT_WINDOW_MS = Number(
  process.env.VOLUNTEER_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000
);
const VOLUNTEER_RATE_LIMIT_MAX = Number(
  process.env.VOLUNTEER_RATE_LIMIT_MAX || 20
);

const volunteerRateLimiter = createIpRateLimiter({
  windowMs: VOLUNTEER_RATE_LIMIT_WINDOW_MS,
  maxRequests: VOLUNTEER_RATE_LIMIT_MAX,
  errorCode: 'VOLUNTEER_RATE_LIMITED',
  message: 'Too many volunteer onboarding requests. Please retry later.',
});

const volunteerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(320),
  skillSummary: z.string().trim().min(20).max(2000),
  isActive: z.boolean().optional().default(true),
});

async function indexVolunteerSkills({ userId, skillSummary }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), INTELLIGENCE_TIMEOUT_MS);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (INTELLIGENCE_SERVICE_TOKEN) {
      headers['x-service-token'] = INTELLIGENCE_SERVICE_TOKEN;
    }

    const response = await fetch(
      `${INTELLIGENCE_URL}/api/v1/volunteers/index`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, skillSummary }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Indexing service returned ${response.status}: ${errorBody || 'unknown error'}`
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}

router.post('/', volunteerRateLimiter, async (req, res) => {
  const parsed = volunteerSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'Invalid volunteer payload.',
      details: parsed.error.flatten(),
    });
  }

  const { fullName, email, skillSummary, isActive } = parsed.data;
  let dbClient;

  try {
    dbClient = await pool.connect();
    await dbClient.query('BEGIN');
    await dbClient.query('SET LOCAL TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    const insertSql = `
      INSERT INTO users (full_name, email, is_active)
      VALUES ($1, $2, $3)
      ON CONFLICT (email)
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        is_active = EXCLUDED.is_active
      RETURNING id, full_name, email, is_active
    `;

    const result = await dbClient.query(insertSql, [fullName, email, isActive]);
    const volunteer = result.rows[0];

    await dbClient.query('COMMIT');

    let embeddingIndexed = true;
    let warning;

    try {
      await indexVolunteerSkills({
        userId: volunteer.id,
        skillSummary,
      });
    } catch (indexErr) {
      embeddingIndexed = false;
      warning =
        'Volunteer created, but embedding index failed. Retry indexing from intelligence service.';
      console.error('Volunteer indexing failed', indexErr);
    }

    return res.status(201).json({
      success: true,
      volunteerId: volunteer.id,
      embeddingIndexed,
      warning,
      volunteer: {
        id: volunteer.id,
        fullName: volunteer.full_name,
        email: volunteer.email,
        isActive: volunteer.is_active,
      },
    });
  } catch (err) {
    if (dbClient) {
      await dbClient.query('ROLLBACK');
    }

    if (err && err.code === '40001') {
      return res.status(409).json({
        success: false,
        errorCode: 'SERIALIZATION_FAILURE',
        message: 'Transaction conflict. Retry request.',
      });
    }

    console.error('Volunteer create failed', err);
    return res.status(500).json({
      success: false,
      errorCode: 'VOLUNTEER_CREATE_FAILED',
      message: 'Unable to create volunteer profile.',
    });
  } finally {
    if (dbClient) {
      dbClient.release();
    }
  }
});

module.exports = router;
