import { marketDataService } from '../marketDataService';

describe('MarketDataService', () => {
  describe('getAllTickers', () => {
    it('should return all tickers', () => {
      const tickers = marketDataService.getAllTickers();
      expect(tickers).toHaveLength(4);
      expect(tickers.map((t) => t.symbol)).toContain('AAPL');
      expect(tickers.map((t) => t.symbol)).toContain('TSLA');
      expect(tickers.map((t) => t.symbol)).toContain('BTC-USD');
      expect(tickers.map((t) => t.symbol)).toContain('BTC');
    });

    it('should return tickers with required properties', () => {
      const tickers = marketDataService.getAllTickers();
      tickers.forEach((ticker) => {
        expect(ticker).toHaveProperty('symbol');
        expect(ticker).toHaveProperty('name');
        expect(ticker).toHaveProperty('price');
        expect(ticker).toHaveProperty('change');
        expect(ticker).toHaveProperty('changePercent');
        expect(ticker).toHaveProperty('timestamp');
      });
    });
  });

  describe('getTicker', () => {
    it('should return a specific ticker', () => {
      const ticker = marketDataService.getTicker('AAPL');
      expect(ticker).toBeDefined();
      expect(ticker?.symbol).toBe('AAPL');
      expect(ticker?.name).toBe('Apple Inc.');
    });

    it('should return undefined for non-existent ticker', () => {
      const ticker = marketDataService.getTicker('INVALID');
      expect(ticker).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      const ticker = marketDataService.getTicker('aapl');
      expect(ticker).toBeUndefined();
    });
  });

  describe('generateHistoricalData', () => {
    it('should generate historical data for valid ticker', () => {
      const result = marketDataService.generateHistoricalData('AAPL', 30);
      expect(result).toBeDefined();
      expect(result?.symbol).toBe('AAPL');
      expect(result?.data).toHaveLength(30);
    });

    it('should return null for invalid ticker', () => {
      const result = marketDataService.generateHistoricalData('INVALID', 30);
      expect(result).toBeNull();
    });

    it('should generate data points with required properties', () => {
      const result = marketDataService.generateHistoricalData('TSLA', 10);
      expect(result).toBeDefined();

      result?.data.forEach((point) => {
        expect(point).toHaveProperty('timestamp');
        expect(point).toHaveProperty('price');
        expect(point).toHaveProperty('volume');
        expect(typeof point.timestamp).toBe('number');
        expect(typeof point.price).toBe('number');
        expect(point.price).toBeGreaterThan(0);
      });
    });

    it('should generate data in chronological order', () => {
      const result = marketDataService.generateHistoricalData('BTC-USD', 20);
      expect(result).toBeDefined();

      for (let i = 1; i < result!.data.length; i++) {
        expect(result!.data[i].timestamp).toBeGreaterThan(result!.data[i - 1].timestamp);
      }
    });

    it('should use default points value', () => {
      const result = marketDataService.generateHistoricalData('AAPL');
      expect(result?.data).toHaveLength(50);
    });
  });

  describe('getRecentHistory', () => {
    it('should return empty array when no history exists', () => {
      const history = marketDataService.getRecentHistory('AAPL');
      expect(Array.isArray(history)).toBe(true);
    });

    it('should return empty array for invalid ticker', () => {
      const history = marketDataService.getRecentHistory('INVALID');
      expect(Array.isArray(history)).toBe(true);
      expect(history).toHaveLength(0);
    });
  });

  describe('price simulation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      marketDataService.stopPriceSimulation();
    });

    it('should call callback with updated tickers', () => {
      const callback = jest.fn();

      marketDataService.startPriceSimulation(callback);

      // Fast-forward time by 3000ms (the interval delay)
      jest.advanceTimersByTime(3000);

      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expect.any(Array));

      const tickers = callback.mock.calls[0][0];
      expect(tickers).toHaveLength(4);
    });

    it('should not start multiple simulations', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      marketDataService.startPriceSimulation(callback1);
      marketDataService.startPriceSimulation(callback2); // Should be ignored

      // Fast-forward time
      jest.advanceTimersByTime(3000);

      // Only callback1 should be called, callback2 should be ignored
      expect(callback1).toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });
});
