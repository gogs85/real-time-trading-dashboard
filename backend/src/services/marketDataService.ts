import { Ticker, HistoricalDataPoint, HistoricalData } from '../types';

const TICKERS_CONFIG = [
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 175.50 },
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 242.80 },
  { symbol: 'BTC-USD', name: 'Bitcoin USD', basePrice: 37500.00 },
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
    TICKERS_CONFIG.forEach(config => {
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
    const volatility = ticker.symbol === 'BTC-USD' ? 0.02 : 0.01;
    const changePercent = (Math.random() - 0.5) * 2 * volatility;
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
    }, 2000);
  }

  stopPriceSimulation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Generate mock historical data
  generateHistoricalData(symbol: string, points: number = 50): HistoricalData | null {
    const ticker = this.tickers.get(symbol);
    if (!ticker) {
      return null;
    }

    const data: HistoricalDataPoint[] = [];
    const now = Date.now();
    const interval = 60000; // 1 minute intervals
    let currentPrice = ticker.price;

    for (let i = points - 1; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const volatility = symbol === 'BTC-USD' ? 0.015 : 0.008;
      const change = (Math.random() - 0.5) * 2 * volatility;
      currentPrice = currentPrice * (1 + change);
      
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

