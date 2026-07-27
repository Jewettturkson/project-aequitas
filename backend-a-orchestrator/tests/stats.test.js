const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const app = require('../app');
const pool = require('../config/pool');

describe('GET /api/v1/stats', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns aggregate platform stats', async () => {
    sinon.stub(pool, 'query').resolves({
      rows: [{ volunteers: 12, total_impact: '340.50', active_projects: 4 }],
    });

    const res = await request(app).get('/api/v1/stats');

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({
      volunteers: 12,
      totalImpact: 340.5,
      activeProjects: 4,
    });
  });

  it('returns zeroes when the database has no rows', async () => {
    sinon.stub(pool, 'query').resolves({ rows: [] });

    const res = await request(app).get('/api/v1/stats');

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ volunteers: 0, totalImpact: 0, activeProjects: 0 });
  });

  it('returns 500 with a stable error code on query failure', async () => {
    sinon.stub(pool, 'query').rejects(new Error('boom'));

    const res = await request(app).get('/api/v1/stats');

    expect(res.status).to.equal(500);
    expect(res.body.errorCode).to.equal('STATS_QUERY_FAILED');
  });
});
