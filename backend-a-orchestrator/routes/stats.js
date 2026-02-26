const express = require('express');
const pool = require('../config/pool');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT
        (SELECT COUNT(*)::int FROM users WHERE is_active = TRUE) AS volunteers,
        (SELECT COALESCE(SUM(impact_value), 0)::numeric(14,2) FROM impact_ledger) AS total_impact,
        (SELECT COUNT(*)::int FROM projects WHERE status IN ('OPEN', 'IN_PROGRESS')) AS active_projects
    `;

    const result = await pool.query(sql);
    const row = result.rows[0] || {};

    return res.status(200).json({
      volunteers: Number(row.volunteers || 0),
      totalImpact: Number(row.total_impact || 0),
      activeProjects: Number(row.active_projects || 0),
    });
  } catch (err) {
    console.error('Stats query failed', err);
    return res.status(500).json({
      errorCode: 'STATS_QUERY_FAILED',
      message: 'Unable to load dashboard statistics.',
    });
  }
});

module.exports = router;
