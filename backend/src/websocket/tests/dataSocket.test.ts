import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { MarketDataWebSocket } from '../dataSocket';
import { marketDataService } from '../../services/marketDataService';
import { config } from '../../config';
import { Ticker } from '../../types';

// Mock the market data service
jest.mock('../../services/marketDataService');

describe('MarketDataWebSocket', () => {
  let httpServer: HTTPServer;
  let marketDataWS: MarketDataWebSocket;
  let clientSocket: ClientSocket;
  let validToken: string;
  const TEST_PORT = 3002;

  const mockTickers: Ticker[] = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 175.5,
      change: 2.5,
      changePercent: 1.45,
      timestamp: Date.now(),
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 242.8,
      change: -1.2,
      changePercent: -0.49,
      timestamp: Date.now(),
    },
  ];

  beforeAll(() => {
    // Create a valid token for testing
    validToken = jwt.sign({ userId: '123', username: 'testuser' }, config.jwtSecret, {
      expiresIn: '1h',
    });
  });

  beforeEach((done) => {
    // Mock the market data service methods
    (marketDataService.getAllTickers as jest.Mock).mockReturnValue(mockTickers);
    (marketDataService.startPriceSimulation as jest.Mock).mockImplementation(() => {});
    (marketDataService.stopPriceSimulation as jest.Mock).mockImplementation(() => {});

    // Create HTTP server and WebSocket
    httpServer = createServer();
    marketDataWS = new MarketDataWebSocket(httpServer);

    httpServer.listen(TEST_PORT, () => {
      done();
    });
  });

  afterEach((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }

    marketDataWS.close();
    httpServer.close(() => {
      done();
    });
  });

  describe('Connection Authentication', () => {
    it('should connect successfully with valid token in auth', (done) => {
      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws/',
        auth: { token: validToken },
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(new Error(`Should not fail: ${error.message}`));
      });
    });

    it('should connect successfully with valid token in query', (done) => {
      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws/',
        query: { token: validToken },
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(new Error(`Should not fail: ${error.message}`));
      });
    });

    it('should fail to connect without token', (done) => {
      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws/',
      });

      clientSocket.on('connect', () => {
        done(new Error('Should not connect without token'));
      });

      clientSocket.on('connect_error', (error) => {
        expect(error.message).toBe('Missing token');
        done();
      });
    });

    it('should fail to connect with invalid token', (done) => {
      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws/',
        auth: { token: 'invalid-token' },
      });

      clientSocket.on('connect', () => {
        done(new Error('Should not connect with invalid token'));
      });

      clientSocket.on('connect_error', (error) => {
        expect(error.message).toBe('Invalid token');
        done();
      });
    });

    it('should fail to connect with expired token', (done) => {
      const expiredToken = jwt.sign({ userId: '123', username: 'testuser' }, config.jwtSecret, {
        expiresIn: '-1h',
      });

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws/',
        auth: { token: expiredToken },
      });

      clientSocket.on('connect', () => {
        done(new Error('Should not connect with expired token'));
      });

      clientSocket.on('connect_error', (error) => {
        expect(error.message).toBe('Invalid token');
        done();
      });
    });
  });

  describe('Events', () => {
    beforeEach((done) => {
      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws/',
        auth: { token: validToken },
      });

      clientSocket.on('connect', () => {
        done();
      });
    });

    it('should handle subscribe event', (done) => {
      const subscribeData = { symbols: ['AAPL', 'TSLA'] };

      clientSocket.emit('subscribe', subscribeData);

      clientSocket.on('subscribed', (response) => {
        expect(response.success).toBe(true);
        expect(response.data).toEqual(subscribeData);
        done();
      });
    });

    it('should handle unsubscribe event', (done) => {
      const unsubscribeData = { symbols: ['AAPL'] };

      clientSocket.emit('unsubscribe', unsubscribeData);

      clientSocket.on('unsubscribed', (response) => {
        expect(response.success).toBe(true);
        expect(response.data).toEqual(unsubscribeData);
        done();
      });
    });

    it('should handle disconnect event', (done) => {
      clientSocket.on('disconnect', () => {
        expect(clientSocket.connected).toBe(false);
        done();
      });

      clientSocket.disconnect();
    });
  });

  describe('Broadcasting', () => {
    let clientSocket2: ClientSocket;

    beforeEach((done) => {
      let connectedCount = 0;

      const checkBothConnected = () => {
        connectedCount++;
        if (connectedCount === 2) {
          done();
        }
      };

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws/',
        auth: { token: validToken },
      });

      clientSocket2 = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws/',
        auth: { token: validToken },
      });

      clientSocket.on('connect', checkBothConnected);
      clientSocket2.on('connect', checkBothConnected);
    });

    afterEach(() => {
      if (clientSocket2 && clientSocket2.connected) {
        clientSocket2.disconnect();
      }
    });

    it('should broadcast price updates to all connected clients', (done) => {
      const updatedTickers: Ticker[] = [
        { ...mockTickers[0], price: 180.0 },
        { ...mockTickers[1], price: 250.0 },
      ];

      let receivedCount = 0;

      const handleBroadcast = (tickers: Ticker[]) => {
        if (tickers[0]?.price === 180.0) {
          // This is our broadcasted update, not the initial one
          expect(tickers).toEqual(updatedTickers);
          receivedCount++;

          // Both clients should receive it
          if (receivedCount === 2) {
            done();
          }
        }
      };

      clientSocket.on('price_update', handleBroadcast);
      clientSocket2.on('price_update', handleBroadcast);

      // Simulate broadcasting after connections are established
      setTimeout(() => {
        marketDataWS.getIO().emit('price_update', updatedTickers);
      }, 100);
    }, 10000);

    it('should broadcast custom events to all clients', (done) => {
      const testData = { message: 'test broadcast' };
      let receivedCount = 0;

      const handleTestEvent = (data: any) => {
        expect(data).toEqual(testData);
        receivedCount++;

        if (receivedCount === 2) {
          done();
        }
      };

      clientSocket.on('test_event', handleTestEvent);
      clientSocket2.on('test_event', handleTestEvent);

      setTimeout(() => {
        marketDataWS.getIO().emit('test_event', testData);
      }, 100);
    });
  });

  describe('Lifecycle', () => {
    it('should start price simulation on initialization', () => {
      expect(marketDataService.startPriceSimulation).toHaveBeenCalled();
    });

    it('should stop price simulation on close', () => {
      marketDataWS.close();
      expect(marketDataService.stopPriceSimulation).toHaveBeenCalled();
    });

    it('should close socket.io server on close', (done) => {
      marketDataWS.close();

      // Try to connect after closing
      const testSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws/',
        auth: { token: validToken },
        timeout: 1000,
      });

      testSocket.on('connect', () => {
        testSocket.disconnect();
        done(new Error('Should not connect to closed server'));
      });

      testSocket.on('connect_error', () => {
        testSocket.disconnect();
        done();
      });
    });
  });
});
