import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { marketDataService } from '../services/marketDataService';
import { Ticker } from '../types';

export class MarketDataWebSocket {
  private io: Server;

  constructor(server: HTTPServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/ws/',
    });

    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Missing token'));
      }

      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!);
        socket.data.user = payload; // store user if needed
        next();
      } catch (err) {
        next(new Error('Invalid token'));
      }
    });
    this.initialize();
  }

  private initialize(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`New client connected: ${socket.id}`);

      const tickers = marketDataService.getAllTickers();
      socket.emit('price_update', tickers);

      socket.on('subscribe', (data: any) => {
        console.log(`Subscribe request from ${socket.id}:`, data);
        socket.emit('subscribed', { success: true, data });
      });

      socket.on('unsubscribe', (data: any) => {
        console.log(`Unsubscribe request from ${socket.id}:`, data);
        socket.emit('unsubscribed', { success: true, data });
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    marketDataService.startPriceSimulation((tickers: Ticker[]) => {
      this.broadcast('price_update', tickers);
    });
  }

  private broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  close(): void {
    marketDataService.stopPriceSimulation();
    this.io.close();
  }

  getIO(): Server {
    return this.io;
  }
}
