import request from 'supertest';
import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import tickerRoutes from '../tickerRoutes';
import { marketDataService } from '../../services/marketDataService';
import { cacheService } from '../../services/cacheService';
import { config } from '../../config';
import { Ticker, HistoricalData, HistoricalDataPoint } from '../../types';

// Mock the services
jest.mock('../../services/marketDataService');
jest.mock('../../services/cacheService');

describe('Ticker Routes', () => {
  let app: Express;
  let validToken: string;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', tickerRoutes);

    // Create a valid token for authenticated requests
    validToken = jwt.sign({ userId: '123', username: 'testuser' }, config.jwtSecret, {
      expiresIn: '1h',
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tickers', () => {
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
      {
        symbol: 'BTC-USD',
        name: 'Bitcoin USD',
        price: 37500.0,
        change: 500.0,
        changePercent: 1.35,
        timestamp: Date.now(),
      },
    ];

    it('should return all tickers without authentication', async () => {
      (marketDataService.getAllTickers as jest.Mock).mockReturnValue(mockTickers);

      const response = await request(app).get('/api/tickers');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tickers');
      expect(response.body.tickers).toHaveLength(3);
      expect(response.body.tickers[0].symbol).toBe('AAPL');
      expect(marketDataService.getAllTickers).toHaveBeenCalledTimes(1);
    });

    it('should return all tickers with authentication', async () => {
      (marketDataService.getAllTickers as jest.Mock).mockReturnValue(mockTickers);

      const response = await request(app)
        .get('/api/tickers')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tickers).toHaveLength(3);
    });

    it('should return 500 when service throws error', async () => {
      (marketDataService.getAllTickers as jest.Mock).mockImplementation(() => {
        throw new Error('Service error');
      });

      const response = await request(app).get('/api/tickers');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Failed to fetch tickers');
    });
  });

  describe('GET /api/tickers/:symbol', () => {
    const mockTicker: Ticker = {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 175.5,
      change: 2.5,
      changePercent: 1.45,
      timestamp: Date.now(),
    };

    it('should return a specific ticker by symbol (uppercase)', async () => {
      (marketDataService.getTicker as jest.Mock).mockReturnValue(mockTicker);

      const response = await request(app).get('/api/tickers/AAPL');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ticker');
      expect(response.body.ticker.symbol).toBe('AAPL');
      expect(response.body.ticker.name).toBe('Apple Inc.');
      expect(marketDataService.getTicker).toHaveBeenCalledWith('AAPL');
    });

    it('should return a specific ticker by symbol (lowercase converted to uppercase)', async () => {
      (marketDataService.getTicker as jest.Mock).mockReturnValue(mockTicker);

      const response = await request(app).get('/api/tickers/aapl');

      expect(response.status).toBe(200);
      expect(response.body.ticker.symbol).toBe('AAPL');
      expect(marketDataService.getTicker).toHaveBeenCalledWith('AAPL');
    });

    it('should return 404 when ticker is not found', async () => {
      (marketDataService.getTicker as jest.Mock).mockReturnValue(null);

      const response = await request(app).get('/api/tickers/INVALID');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Ticker not found');
    });

    it('should return 500 when service throws error', async () => {
      (marketDataService.getTicker as jest.Mock).mockImplementation(() => {
        throw new Error('Service error');
      });

      const response = await request(app).get('/api/tickers/AAPL');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch ticker');
    });
  });

  describe('GET /api/tickers/:symbol/history', () => {
    const mockHistoricalData: HistoricalData = {
      symbol: 'AAPL',
      data: [
        { timestamp: Date.now() - 3600000, price: 175.0 },
        { timestamp: Date.now() - 1800000, price: 175.3 },
        { timestamp: Date.now(), price: 175.5 },
      ],
    };

    it('should return historical data without cache', async () => {
      (cacheService.get as jest.Mock).mockReturnValue(null);
      (marketDataService.generateHistoricalData as jest.Mock).mockReturnValue(mockHistoricalData);

      const response = await request(app).get('/api/tickers/AAPL/history');

      expect(response.status).toBe(200);
      expect(response.body.symbol).toBe('AAPL');
      expect(response.body.data).toHaveLength(3);
      expect(response.body.cached).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith('history:AAPL:50');
      expect(marketDataService.generateHistoricalData).toHaveBeenCalledWith('AAPL', 50);
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should return cached historical data when available', async () => {
      (cacheService.get as jest.Mock).mockReturnValue(mockHistoricalData);

      const response = await request(app).get('/api/tickers/AAPL/history');

      expect(response.status).toBe(200);
      expect(response.body.symbol).toBe('AAPL');
      expect(response.body.cached).toBe(true);
      expect(cacheService.get).toHaveBeenCalled();
      expect(marketDataService.generateHistoricalData).not.toHaveBeenCalled();
    });

    it('should accept custom points parameter', async () => {
      (cacheService.get as jest.Mock).mockReturnValue(null);
      (marketDataService.generateHistoricalData as jest.Mock).mockReturnValue(mockHistoricalData);

      const response = await request(app).get('/api/tickers/AAPL/history?points=100');

      expect(response.status).toBe(200);
      expect(cacheService.get).toHaveBeenCalledWith('history:AAPL:100');
      expect(marketDataService.generateHistoricalData).toHaveBeenCalledWith('AAPL', 100);
    });

    it('should handle lowercase symbol', async () => {
      (cacheService.get as jest.Mock).mockReturnValue(null);
      (marketDataService.generateHistoricalData as jest.Mock).mockReturnValue(mockHistoricalData);

      const response = await request(app).get('/api/tickers/aapl/history');

      expect(response.status).toBe(200);
      expect(marketDataService.generateHistoricalData).toHaveBeenCalledWith('AAPL', 50);
    });

    it('should return 404 when ticker is not found', async () => {
      (cacheService.get as jest.Mock).mockReturnValue(null);
      (marketDataService.generateHistoricalData as jest.Mock).mockReturnValue(null);

      const response = await request(app).get('/api/tickers/INVALID/history');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Ticker not found');
    });

    it('should return 500 when service throws error', async () => {
      (cacheService.get as jest.Mock).mockImplementation(() => {
        throw new Error('Cache error');
      });

      const response = await request(app).get('/api/tickers/AAPL/history');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch historical data');
    });
  });

  describe('GET /api/tickers/:symbol/recent', () => {
    const mockRecentData: HistoricalDataPoint[] = [
      { timestamp: Date.now() - 60000, price: 175.0 },
      { timestamp: Date.now() - 30000, price: 175.3 },
      { timestamp: Date.now(), price: 175.5 },
    ];

    it('should return recent history data', async () => {
      (marketDataService.getRecentHistory as jest.Mock).mockReturnValue(mockRecentData);

      const response = await request(app).get('/api/tickers/AAPL/recent');

      expect(response.status).toBe(200);
      expect(response.body.symbol).toBe('AAPL');
      expect(response.body.data).toHaveLength(3);
      expect(marketDataService.getRecentHistory).toHaveBeenCalledWith('AAPL', 20);
    });

    it('should accept custom limit parameter', async () => {
      (marketDataService.getRecentHistory as jest.Mock).mockReturnValue(mockRecentData);

      const response = await request(app).get('/api/tickers/AAPL/recent?limit=50');

      expect(response.status).toBe(200);
      expect(marketDataService.getRecentHistory).toHaveBeenCalledWith('AAPL', 50);
    });

    it('should handle lowercase symbol', async () => {
      (marketDataService.getRecentHistory as jest.Mock).mockReturnValue(mockRecentData);

      const response = await request(app).get('/api/tickers/tsla/recent');

      expect(response.status).toBe(200);
      expect(response.body.symbol).toBe('TSLA');
      expect(marketDataService.getRecentHistory).toHaveBeenCalledWith('TSLA', 20);
    });

    it('should return empty array when no recent data exists', async () => {
      (marketDataService.getRecentHistory as jest.Mock).mockReturnValue([]);

      const response = await request(app).get('/api/tickers/AAPL/recent');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should return 500 when service throws error', async () => {
      (marketDataService.getRecentHistory as jest.Mock).mockImplementation(() => {
        throw new Error('Service error');
      });

      const response = await request(app).get('/api/tickers/AAPL/recent');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch recent data');
    });
  });
});
