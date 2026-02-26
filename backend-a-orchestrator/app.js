const express = require('express');
const contributionsRouter = require('./routes/contributions');
const statusRouter = require('./routes/status');
const statsRouter = require('./routes/stats');

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  return next();
});

app.use(express.json({ limit: '1mb' }));

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/status', statusRouter);
app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/contributions', contributionsRouter);

app.use((err, req, res, next) => {
  console.error('Unhandled application error', err);
  res.status(500).json({
    success: false,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected application error.',
  });
});

module.exports = app;
