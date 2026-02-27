const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const app = require('../app');
const pool = require('../config/pool');

describe('Project Intake Auth And Validation', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('requires Firebase bearer token to list project applications', async () => {
    const res = await request(app).get(
      '/api/v1/projects/770e8400-e29b-41d4-a716-446655441111/applications'
    );

    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
    expect(res.body.errorCode).to.equal('UNAUTHORIZED');
  });

  it('requires Firebase bearer token to update project status', async () => {
    const res = await request(app)
      .patch('/api/v1/projects/770e8400-e29b-41d4-a716-446655441111/status')
      .send({ status: 'COMPLETED' });

    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
    expect(res.body.errorCode).to.equal('UNAUTHORIZED');
  });

  it('rejects payloads with only one coordinate', async () => {
    const connectStub = sinon.stub(pool, 'connect');

    const res = await request(app).post('/api/v1/projects/public').send({
      name: 'Optional Coordinates Validation',
      description:
        'This payload includes only one coordinate and should fail validation.',
      latitude: 5.12345,
      contactEmail: 'projects@enturk.org',
    });

    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
    expect(res.body.errorCode).to.equal('VALIDATION_ERROR');
    expect(connectStub.called).to.equal(false);
  });
});
