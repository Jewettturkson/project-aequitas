const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const app = require('../app');
const pool = require('../config/pool');

describe('GET /healthz', () => {
  it('should return service health', async () => {
    const res = await request(app).get('/healthz');

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ status: 'ok' });
  });
});

describe('POST /api/v1/contributions', () => {
  let fakeClient;

  beforeEach(() => {
    fakeClient = {
      query: sinon.stub(),
      release: sinon.stub(),
    };
    sinon.stub(pool, 'connect').resolves(fakeClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should successfully record a contribution and return 201', async () => {
    const payload = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '770e8400-e29b-41d4-a716-446655441111',
      impactType: 'hours',
      impactValue: 5.5,
      evidenceUrl: 'https://s3.amazon.com/enturk-proof/photo1.jpg',
    };

    fakeClient.query.onCall(0).resolves(); // BEGIN
    fakeClient.query.onCall(1).resolves(); // SET LOCAL
    fakeClient.query
      .onCall(2)
      .resolves({ rows: [{ transaction_id: '990e8400-e29b-41d4-a716-446655442222' }] }); // INSERT
    fakeClient.query.onCall(3).resolves(); // COMMIT

    const res = await request(app).post('/api/v1/contributions').send(payload);

    expect(res.status).to.equal(201);
    expect(res.body.success).to.be.true;
    expect(res.body).to.have.property('transactionId');
    expect(fakeClient.release.calledOnce).to.be.true;
  });

  it('should return 400 for invalid data types', async () => {
    const res = await request(app)
      .post('/api/v1/contributions')
      .send({ impactValue: 'not-a-number' });

    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
    expect(pool.connect.called).to.equal(false);
  });

  it('should return 500 when the database connection cannot be established', async () => {
    pool.connect.restore();
    sinon.stub(pool, 'connect').rejects(new Error('connection failed'));

    const res = await request(app).post('/api/v1/contributions').send({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '770e8400-e29b-41d4-a716-446655441111',
      impactType: 'hours',
      impactValue: 5.5,
    });

    expect(res.status).to.equal(500);
    expect(res.body.success).to.equal(false);
    expect(res.body.errorCode).to.equal('CONTRIBUTION_WRITE_FAILED');
  });
});
