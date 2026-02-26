const express = require('express');
const { z } = require('zod');
const pool = require('../config/pool');
const { createIpRateLimiter } = require('../middleware/rateLimit');
const { requireAdminKey } = require('../middleware/auth');

const router = express.Router();
const PROJECT_RATE_LIMIT_WINDOW_MS = Number(
  process.env.PROJECT_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000
);
const PROJECT_RATE_LIMIT_MAX = Number(
  process.env.PROJECT_RATE_LIMIT_MAX || 10
);

const projectRateLimiter = createIpRateLimiter({
  windowMs: PROJECT_RATE_LIMIT_WINDOW_MS,
  maxRequests: PROJECT_RATE_LIMIT_MAX,
  errorCode: 'PROJECT_RATE_LIMITED',
  message: 'Too many project posting requests. Please retry later.',
});
const projectAdminAuth = requireAdminKey({
  envVar: 'PROJECT_ADMIN_KEY',
  headerName: 'x-admin-key',
});

const projectSchema = z.object({
  name: z.string().trim().min(3).max(180),
  description: z.string().trim().min(20).max(4000),
  latitude: z.coerce.number().gte(-90).lte(90),
  longitude: z.coerce.number().gte(-180).lte(180),
  status: z
    .enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional()
    .default('OPEN'),
});

async function getProjectColumnCapabilities(dbClient) {
  const sql = `
    SELECT
      column_name,
      (is_nullable = 'NO') AS not_null
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'projects'
  `;

  const result = await dbClient.query(sql);
  const columns = new Set(result.rows.map((row) => row.column_name));
  const nonNullable = new Set(
    result.rows.filter((row) => row.not_null).map((row) => row.column_name)
  );

  return {
    hasDescription: columns.has('description'),
    hasStatus: columns.has('status'),
    hasGeoPoint: columns.has('geo_point'),
    geoPointRequired: nonNullable.has('geo_point'),
  };
}

router.post('/', projectRateLimiter, projectAdminAuth, async (req, res) => {
  const parsed = projectSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'Invalid project payload.',
      details: parsed.error.flatten(),
    });
  }

  const data = parsed.data;
  let dbClient;

  try {
    dbClient = await pool.connect();
    await dbClient.query('BEGIN');
    await dbClient.query('SET LOCAL TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    const capabilities = await getProjectColumnCapabilities(dbClient);

    if (capabilities.geoPointRequired && !capabilities.hasGeoPoint) {
      throw new Error(
        'projects.geo_point marked required but column metadata unavailable.'
      );
    }

    const columns = ['name'];
    const values = [data.name];
    const valueSql = ['$1'];
    let nextParamIndex = 2;

    if (capabilities.hasDescription) {
      columns.push('description');
      values.push(data.description);
      valueSql.push(`$${nextParamIndex}`);
      nextParamIndex += 1;
    }

    if (capabilities.hasStatus) {
      columns.push('status');
      values.push(data.status);
      valueSql.push(`$${nextParamIndex}`);
      nextParamIndex += 1;
    }

    if (capabilities.hasGeoPoint) {
      columns.push('geo_point');
      values.push(data.longitude, data.latitude);
      valueSql.push(`POINT($${nextParamIndex}, $${nextParamIndex + 1})`);
      nextParamIndex += 2;
    }

    const insertSql = `
      INSERT INTO projects (${columns.join(', ')})
      VALUES (${valueSql.join(', ')})
      RETURNING id, name
    `;

    const result = await dbClient.query(insertSql, values);
    const project = result.rows[0];

    await dbClient.query('COMMIT');

    return res.status(201).json({
      success: true,
      projectId: project.id,
      project: {
        id: project.id,
        name: project.name,
        status: data.status,
        description: data.description,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
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

    if (err && err.code === '23502') {
      return res.status(400).json({
        success: false,
        errorCode: 'PROJECT_SCHEMA_CONSTRAINT',
        message:
          'Project table has stricter required fields than provided payload. Validate schema and retry.',
      });
    }

    console.error('Project create failed', err);
    return res.status(500).json({
      success: false,
      errorCode: 'PROJECT_CREATE_FAILED',
      message: 'Unable to create project.',
    });
  } finally {
    if (dbClient) {
      dbClient.release();
    }
  }
});

module.exports = router;
