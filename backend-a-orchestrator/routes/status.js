const express = require('express');
const pool = require('../config/pool');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      db: 'connected',
      status: 'ok',
    });
  } catch (err) {
    console.error('Status check failed', err);
    return res.status(503).json({
      db: 'disconnected',
      status: 'degraded',
    });
  }
});

module.exports = router;
