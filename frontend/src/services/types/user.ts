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
  cached?: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface WebSocketMessage {
  type: 'price_update' | 'subscribe' | 'unsubscribe' | 'error';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}
