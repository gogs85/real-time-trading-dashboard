import request from 'supertest';
import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import authRoutes from '../authRoutes';
import { config } from '../../config';

describe('Auth Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials (demo user)', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'demo',
        password: 'demo123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('demo');
      expect(response.body.user.email).toBe('demo@example.com');
      expect(response.body.user).not.toHaveProperty('password');

      // Verify token is valid
      const decoded = jwt.verify(response.body.token, config.jwtSecret) as any;
      expect(decoded.username).toBe('demo');
      expect(decoded.userId).toBeDefined();
    });

    it('should login successfully with valid credentials (trader user)', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'trader',
        password: 'trader123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.username).toBe('trader');
      expect(response.body.user.email).toBe('trader@example.com');
    });

    it('should return 400 when username is missing', async () => {
      const response = await request(app).post('/api/auth/login').send({
        password: 'demo123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Username and password required');
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'demo',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username and password required');
    });

    it('should return 401 with invalid username', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'nonexistent',
        password: 'demo123',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 with invalid password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'demo',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 400 when both username and password are missing', async () => {
      const response = await request(app).post('/api/auth/login').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username and password required');
    });
  });

  describe('GET /api/auth/verify', () => {
    let validToken: string;

    beforeAll(async () => {
      // Get a valid token first
      const loginResponse = await request(app).post('/api/auth/login').send({
        username: 'demo',
        password: 'demo123',
      });
      validToken = loginResponse.body.token;
    });

    it('should verify a valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('demo');
      expect(response.body.user.userId).toBeDefined();
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('No token provided');
    });

    it('should return 403 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid token');
      expect(response.body.valid).toBe(false);
    });

    it('should return 403 with expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign({ userId: '123', username: 'test' }, config.jwtSecret, {
        expiresIn: '-1h',
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.valid).toBe(false);
    });

    it('should return 401 with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });
  });
});
