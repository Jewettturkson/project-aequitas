const express = require('express');
const contributionsRouter = require('./routes/contributions');
const volunteersRouter = require('./routes/volunteers');
const projectsRouter = require('./routes/projects');
const statusRouter = require('./routes/status');
const statsRouter = require('./routes/stats');

const app = express();
app.set('trust proxy', 1);

const defaultAllowedOrigins = [
  'https://nodeenturk.org',
  'https://www.nodeenturk.org',
  'https://app.nodeenturk.org',
];

function normalizeOrigin(value) {
  return value.trim().toLowerCase().replace(/\/+$/, '');
}

function parseAllowedOrigins() {
  const configured = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const merged = [...defaultAllowedOrigins, ...configured];
  return new Set(merged.map(normalizeOrigin));
}

const allowedOrigins = parseAllowedOrigins();

function isAllowedOrigin(origin) {
  const normalized = normalizeOrigin(origin);
  if (allowedOrigins.has(normalized)) {
    return true;
  }

  // Allow any secure subdomain of nodeenturk.org.
  if (/^https:\/\/([a-z0-9-]+\.)*nodeenturk\.org$/.test(normalized)) {
    return true;
  }

  return false;
}

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  if (typeof requestOrigin === 'string' && isAllowedOrigin(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization,X-Admin-Key,X-Requested-With'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
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
app.use('/api/v1/volunteers', volunteersRouter);
app.use('/api/v1/projects', projectsRouter);

app.use((err, req, res, next) => {
  console.error('Unhandled application error', err);
  res.status(500).json({
    success: false,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected application error.',
  });
});

module.exports = app;
