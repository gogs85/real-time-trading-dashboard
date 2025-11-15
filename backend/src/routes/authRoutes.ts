import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { User, AuthPayload } from '../types';

const router = Router();

// Mock user database
const mockUsers: Map<string, User & { password: string }> = new Map([
  [
    'demo',
    {
      id: uuidv4(),
      username: 'demo',
      email: 'demo@example.com',
      password: 'demo123',
    },
  ],
]);

// Mock login endpoint
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  const user = mockUsers.get(username);

  if (!user || user.password !== password) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const payload: AuthPayload = {
    userId: user.id,
    username: user.username,
  };

  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
});

// Verify token endpoint
router.get('/verify', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthPayload;
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(403).json({ error: 'Invalid token', valid: false });
  }
});

export default router;
