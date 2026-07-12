const request = require('supertest');
const { app, httpServer } = require('../index');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  httpServer.close();
});

describe('API Gateway Endpoints', () => {
  
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body.services).toHaveProperty('mongodb');
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({
          title: 'Test Project',
          code: 'print("hello")',
          language: 'python'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toEqual('Test Project');
      expect(res.body.code).toEqual('print("hello")');
    });

    it('should fail without code', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({
          title: 'Test Project'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'Code is required');
    });
  });

});
