const express = require('express');
const { z } = require('zod');
const pool = require('../config/pool');

const router = express.Router();

const contributionSchema = z.object({
  userId: z.string().uuid(),
  projectId: z.string().uuid(),
  impactType: z.string().trim().min(2).max(64),
  impactValue: z.number().positive(),
  evidenceUrl: z.string().url().max(2048).optional(),
});

router.post('/', async (req, res) => {
  const parsed = contributionSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'Invalid contribution payload.',
      details: parsed.error.flatten(),
    });
  }

  const { userId, projectId, impactType, impactValue, evidenceUrl } = parsed.data;
  let dbClient;

  try {
    dbClient = await pool.connect();
    await dbClient.query('BEGIN');
    await dbClient.query('SET LOCAL TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    const insertSql = `
      INSERT INTO impact_ledger (
        user_id, project_id, impact_type, impact_value, evidence_url
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING transaction_id
    `;

    const result = await dbClient.query(insertSql, [
      userId,
      projectId,
      impactType,
      impactValue,
      evidenceUrl ?? null,
    ]);

    const transactionId = result.rows[0].transaction_id;

    await dbClient.query('COMMIT');

    // Background worker pickup point for outbound notifications.
    console.info(
      JSON.stringify({
        eventType: 'CONTRIBUTION_RECORDED',
        transactionId,
        userId,
        projectId,
      })
    );

    return res.status(201).json({
      success: true,
      transactionId,
    });
  } catch (err) {
    if (dbClient) {
      await dbClient.query('ROLLBACK');
    }

    if (err && err.code === '23503') {
      return res.status(404).json({
        success: false,
        errorCode: 'FK_REFERENCE_NOT_FOUND',
        message: 'userId or projectId does not exist.',
      });
    }

    if (err && err.code === '40001') {
      return res.status(409).json({
        success: false,
        errorCode: 'SERIALIZATION_FAILURE',
        message: 'Transaction conflict. Retry request.',
      });
    }

    console.error('Failed to create contribution', err);
    return res.status(500).json({
      success: false,
      errorCode: 'CONTRIBUTION_WRITE_FAILED',
      message: 'Unable to record contribution.',
    });
  } finally {
    if (dbClient) {
      dbClient.release();
    }
  }
});

module.exports = router;
