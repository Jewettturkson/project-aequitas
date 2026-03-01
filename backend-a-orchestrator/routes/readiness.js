const express = require('express');
const pool = require('../config/pool');

const router = express.Router();

const intelligenceUrl = process.env.INTELLIGENCE_URL || '';
const intelligenceHealthUrl = intelligenceUrl
  ? `${intelligenceUrl.replace(/\/+$/, '')}/healthz`
  : '';

router.get('/', async (req, res) => {
  const checks = {
    db: { ok: false },
    intelligence: { ok: false },
  };

  try {
    await pool.query('SELECT 1');
    checks.db.ok = true;
  } catch (err) {
    checks.db.error = err instanceof Error ? err.message : 'db check failed';
  }

  if (intelligenceHealthUrl) {
    try {
      const response = await fetch(intelligenceHealthUrl);
      checks.intelligence.ok = response.ok;
      if (!response.ok) {
        checks.intelligence.error = `intelligence health returned ${response.status}`;
      }
    } catch (err) {
      checks.intelligence.error =
        err instanceof Error ? err.message : 'intelligence check failed';
    }
  } else {
    checks.intelligence.error = 'INTELLIGENCE_URL not configured';
  }

  const ready = checks.db.ok && checks.intelligence.ok;

  return res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'degraded',
    checks,
  });
});

module.exports = router;
