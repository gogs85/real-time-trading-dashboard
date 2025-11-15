import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { config } from './config';
import authRoutes from './routes/authRoutes';
import tickerRoutes from './routes/tickerRoutes';
import { MarketDataWebSocket } from './websocket/dataSocket';



const app: Express = express();
const server = http.createServer(app);

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.use('/api/auth', authRoutes);
app.use('/api', tickerRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const marketDataWS = new MarketDataWebSocket(server);

// Start server
server.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`WebSocket available at ws://localhost:${config.port}/ws`);
  console.log(`Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  marketDataWS.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
