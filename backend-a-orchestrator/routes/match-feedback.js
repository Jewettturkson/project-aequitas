const express = require('express');
const { z } = require('zod');
const pool = require('../config/pool');

const router = express.Router();

const feedbackSchema = z.object({
  projectId: z.string().uuid().optional(),
  volunteerId: z.string().uuid(),
  score: z.coerce.number().min(0).max(1).optional(),
  sentiment: z.enum(['up', 'down']),
  reasonTag: z
    .enum([
      'skills_mismatch',
      'availability_mismatch',
      'location_mismatch',
      'strong_fit',
      'experience_gap',
      'other',
    ])
    .optional()
    .default('other'),
  note: z.string().trim().max(500).optional(),
});

let tableEnsured = false;

async function ensureFeedbackTable() {
  if (tableEnsured) return;
  const sql = `
    CREATE TABLE IF NOT EXISTS match_feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NULL,
      volunteer_id UUID NOT NULL,
      score NUMERIC(6,5) NULL,
      sentiment TEXT NOT NULL CHECK (sentiment IN ('up', 'down')),
      reason_tag TEXT NOT NULL DEFAULT 'other',
      note TEXT NULL,
      source TEXT NOT NULL DEFAULT 'dashboard',
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.query(sql);
  tableEnsured = true;
}

router.post('/', async (req, res) => {
  const parsed = feedbackSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'Invalid match feedback payload.',
      details: parsed.error.flatten(),
    });
  }

  try {
    await ensureFeedbackTable();

    const insertSql = `
      INSERT INTO match_feedback (
        project_id,
        volunteer_id,
        score,
        sentiment,
        reason_tag,
        note
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at
    `;

    const result = await pool.query(insertSql, [
      parsed.data.projectId || null,
      parsed.data.volunteerId,
      parsed.data.score ?? null,
      parsed.data.sentiment,
      parsed.data.reasonTag,
      parsed.data.note || null,
    ]);

    return res.status(201).json({
      success: true,
      feedbackId: result.rows[0].id,
      createdAt: result.rows[0].created_at,
    });
  } catch (err) {
    console.error('Match feedback create failed', err);
    return res.status(500).json({
      success: false,
      errorCode: 'MATCH_FEEDBACK_CREATE_FAILED',
      message: 'Unable to save match feedback.',
    });
  }
});

module.exports = router;
