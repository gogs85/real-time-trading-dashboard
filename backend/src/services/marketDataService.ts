import { Ticker, HistoricalDataPoint, HistoricalData } from '../types';

const TICKERS_CONFIG = [
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 175.5 },
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 242.8 },
  { symbol: 'BTC-USD', name: 'Bitcoin USD', basePrice: 37500.0 },
  { symbol: 'BTC', name: 'Bitcoin', basePrice: 92330.0 },
];

class MarketDataService {
  private tickers: Map<string, Ticker>;
  private priceHistory: Map<string, HistoricalDataPoint[]>;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.tickers = new Map();
    this.priceHistory = new Map();
    this.initializeTickers();
  }

  private initializeTickers(): void {
    TICKERS_CONFIG.forEach((config) => {
      const ticker: Ticker = {
        symbol: config.symbol,
        name: config.name,
        price: config.basePrice,
        change: 0,
        changePercent: 0,
        timestamp: Date.now(),
      };
      this.tickers.set(config.symbol, ticker);
      this.priceHistory.set(config.symbol, []);
    });
  }

  getAllTickers(): Ticker[] {
    return Array.from(this.tickers.values());
  }

  getTicker(symbol: string): Ticker | undefined {
    return this.tickers.get(symbol);
  }

  private generatePriceUpdate(ticker: Ticker): Ticker {
    const volatility = ticker.symbol === 'BTC-USD' || ticker.symbol === 'BTC' ? 0.003 : 0.001;
    const changePercent = (Math.random() - 0.2) * 1 * volatility;
    const priceChange = ticker.price * changePercent;
    const newPrice = ticker.price + priceChange;

    const change = newPrice - ticker.price;
    const changePercentValue = (change / ticker.price) * 100;

    return {
      ...ticker,
      price: parseFloat(newPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercentValue.toFixed(2)),
      timestamp: Date.now(),
    };
  }

  startPriceSimulation(callback: (tickers: Ticker[]) => void): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      const updatedTickers: Ticker[] = [];

      this.tickers.forEach((ticker, symbol) => {
        const updatedTicker = this.generatePriceUpdate(ticker);
        this.tickers.set(symbol, updatedTicker);
        updatedTickers.push(updatedTicker);

        const history = this.priceHistory.get(symbol) || [];
        history.push({
          timestamp: updatedTicker.timestamp,
          price: updatedTicker.price,
        });

        if (history.length > 100) {
          history.shift();
        }

        this.priceHistory.set(symbol, history);
      });

      callback(updatedTickers);
    }, 3000);
  }

  stopPriceSimulation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Generate mock historical data with realistic market movements
  generateHistoricalData(symbol: string, points: number = 50): HistoricalData | null {
    const ticker = this.tickers.get(symbol);
    if (!ticker) {
      return null;
    }

    const data: HistoricalDataPoint[] = [];
    const now = Date.now();

    // Dynamic interval based on number of points requested
    let interval: number;
    if (points <= 100) {
      interval = 60000; // 1 minute
    } else if (points <= 500) {
      interval = 20 * 60000; // 20 minutes
    } else if (points <= 1000) {
      interval = 45 * 60000; // 45 minutes
    } else {
      interval = 2 * 60 * 60000; // 2 hours
    }

    // Start from a lower price to show growth trend
    let currentPrice = ticker.price * 0.85; // Start 15% lower

    // Determine base volatility based on symbol
    const isCrypto = symbol === 'BTC-USD' || symbol === 'BTC';
    const baseVolatility = isCrypto ? 0.015 : 0.008;

    // Simulate market trends
    let trendDirection = Math.random() > 0.5 ? 1 : -1;
    let trendStrength = 0;
    let trendDuration = 0;

    for (let i = points - 1; i >= 0; i--) {
      const timestamp = now - i * interval;

      // Randomly change trend direction and strength
      if (trendDuration <= 0 || Math.random() < 0.05) {
        trendDirection = Math.random() > 0.4 ? 1 : -1; // Slight bias towards upward
        trendStrength = Math.random() * 0.0003; // Trend strength
        trendDuration = Math.floor(Math.random() * 50) + 20; // Trend lasts 20-70 points
      }
      trendDuration--;

      // Random volatility for this point (varies between periods)
      const volatilityMultiplier = 0.5 + Math.random() * 1.5; // 0.5x to 2x base volatility
      const volatility = baseVolatility * volatilityMultiplier;

      // Calculate price change with trend and volatility
      let change = (Math.random() - 0.5) * 2 * volatility;

      // Add trend bias
      change += trendDirection * trendStrength;

      // Occasionally add "market events" - sudden jumps up or down
      if (Math.random() < 0.03) {
        // 3% chance of a market event
        const eventMagnitude = (Math.random() - 0.3) * 0.04; // -1.2% to +2.8% jump (slight upward bias)
        change += eventMagnitude;
      }

      // Apply the change
      currentPrice = currentPrice * (1 + change);

      // Ensure price doesn't go too low or too high
      const minPrice = ticker.price * 0.5; // Don't go below 50% of current
      const maxPrice = ticker.price * 1.3; // Don't go above 130% of current
      currentPrice = Math.max(minPrice, Math.min(maxPrice, currentPrice));

      data.push({
        timestamp,
        price: parseFloat(currentPrice.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 100000,
      });
    }

    return {
      symbol,
      data,
    };
  }

  getRecentHistory(symbol: string, limit: number = 20): HistoricalDataPoint[] {
    const history = this.priceHistory.get(symbol) || [];
    return history.slice(-limit);
  }
}

export const marketDataService = new MarketDataService();
