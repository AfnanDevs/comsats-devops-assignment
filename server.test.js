const request = require('supertest');
const app = require('./server'); // We are importing the app now, not the server

describe('Web App Unit Tests', () => {
  it('Should return the welcome HTML message on GET /', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Welcome to the DevOps Automated Web App!');
  });

  it('Should return JSON status on GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toEqual('UP');
  });
});