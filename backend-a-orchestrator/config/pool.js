const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Database connections will fail.');
}

const sslMode = (process.env.DB_SSL_MODE || 'require').toLowerCase();
const shouldUseSsl =
  sslMode === 'require' || sslMode === 'verify-ca' || sslMode === 'verify-full';

const ssl =
  shouldUseSsl
    ? {
        rejectUnauthorized: sslMode === 'verify-ca' || sslMode === 'verify-full',
      }
    : undefined;

const pool = new Pool({
  connectionString: databaseUrl,
  ssl,
  max: 20, // Amazon standard: enough for scale, but prevents connection exhaustion
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Lead Dev Tip: Log errors to CloudWatch/Observability
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
