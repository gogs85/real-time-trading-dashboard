import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  jwtSecret:
    process.env.JWT_SECRET ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MWE1NGUwOC1jZmU0LTRhZjctOTFjYy05NDQ2ODNhYTBiNmUiLCJ1c2VybmFtZSI6ImRlbW8iLCJpYXQiOjE3NjMxNDYxMzAsImV4cCI6MTc2MzIzMjUzMH0.FOk-Fq4kMmz6u5z5fSNoKqtrPFVUQzjl5_3O70TMpNE',
  nodeEnv: process.env.NODE_ENV || 'development',
  cacheTTL: parseInt(process.env.CACHE_TTL || '300000', 10), // 5 minutes default
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
