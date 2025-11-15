export interface Ticker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface HistoricalDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

export interface HistoricalData {
  symbol: string;
  data: HistoricalDataPoint[];
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthPayload {
  userId: string;
  username: string;
}

export interface WebSocketMessage {
  type: 'price_update' | 'subscribe' | 'unsubscribe' | 'error';
  data: any;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

