const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Amazon standard: enough for scale, but prevents connection exhaustion
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Lead Dev Tip: Log errors to CloudWatch/Observability
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
