import { Router, Response } from 'express';
import { marketDataService } from '../services/marketDataService';
import { cacheService } from '../services/cacheService';
import { config } from '../config';
import { AuthRequest, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/tickers', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const tickers = marketDataService.getAllTickers();
    res.json({ tickers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickers' });
  }
});

router.get('/tickers/:symbol', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.params;
    const ticker = marketDataService.getTicker(symbol.toUpperCase());

    if (!ticker) {
      res.status(404).json({ error: 'Ticker not found' });
      return;
    }

    res.json({ ticker });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticker' });
  }
});

// Get historical data for a ticker
router.get('/tickers/:symbol/history', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.params;
    const points = parseInt(req.query.points as string) || 50;
    const cacheKey = `history:${symbol}:${points}`;

    // Check cache first
    const cached = cacheService.get(cacheKey);
    if (cached) {
      res.json({ ...cached, cached: true });
      return;
    }

    // Generate historical data
    const historicalData = marketDataService.generateHistoricalData(symbol.toUpperCase(), points);

    if (!historicalData) {
      res.status(404).json({ error: 'Ticker not found' });
      return;
    }

    // Cache the result
    cacheService.set(cacheKey, historicalData, config.cacheTTL);

    res.json({ ...historicalData, cached: false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

router.get('/tickers/:symbol/recent', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const recentData = marketDataService.getRecentHistory(symbol.toUpperCase(), limit);

    res.json({ symbol: symbol.toUpperCase(), data: recentData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent data' });
  }
});

export default router;
