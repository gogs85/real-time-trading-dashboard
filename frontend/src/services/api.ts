import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import { config } from '../config';
import type { AuthResponse, HistoricalData, Ticker, User } from './types/user';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export class ApiServiceError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiServiceError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }
  private setupInterceptors(): void {
    // Interceptors to add token to requests if available
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/api/auth/login', {
      username,
      password,
    });
    return response.data;
  }

  async verifyToken(): Promise<{ valid: boolean; user?: User }> {
    const response = await this.api.get('/api/auth/verify');
    return response.data;
  }

  async getTickers(): Promise<{ tickers: Ticker[] }> {
    const response = await this.api.get('/api/tickers');
    return response.data;
  }

  async getTicker(symbol: string): Promise<{ ticker: Ticker }> {
    const response = await this.api.get(`/api/tickers/${symbol}`);
    return response.data;
  }

  async getHistoricalData(symbol: string, points: number = 50): Promise<HistoricalData> {
    const response = await this.api.get(`/api/tickers/${symbol}/history?points=${points}`);
    return response.data;
  }

  async getRecentData(
    symbol: string,
    limit: number = 20
  ): Promise<{ symbol: string; data: Ticker[] }> {
    const response = await this.api.get(`/api/tickers/${symbol}/recent?limit=${limit}`);
    return response.data;
  }
}

export const apiService = new ApiService();
