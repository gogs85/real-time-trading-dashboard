import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '@/services/api';
import type { HistoricalDataPoint, Ticker } from '@/services/types/user';

interface UseTickerHistoryOptions {
  maxDataPoints?: number;
  enabled?: boolean;
}

interface UseTickerHistoryReturn {
  historicalData: HistoricalDataPoint[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearData: () => void;
}

/**
 * Custom hook to fetch and manage historical ticker data
 * Automatically updates the chart data when new ticker prices arrive
 */
export const useTickerHistory = (
  ticker: Ticker | null,
  options: UseTickerHistoryOptions = {}
): UseTickerHistoryReturn => {
  const { maxDataPoints = 50, enabled = true } = options;

  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to avoid unnecessary re-renders
  const dataPointsRef = useRef<HistoricalDataPoint[]>([]);
  const lastTickerPriceRef = useRef<number | null>(null);

  // Fetch initial historical data when ticker changes
  const fetchHistoricalData = useCallback(async () => {
    if (!ticker || !enabled) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getHistoricalData(ticker.symbol, maxDataPoints);
      dataPointsRef.current = response.data;
      setHistoricalData(response.data);
      
      // Store last price to avoid duplicate updates
      lastTickerPriceRef.current = ticker.price;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load historical data';
      setError(errorMessage);
      console.error('Error fetching historical data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [ticker?.symbol, maxDataPoints, enabled]);

  // Initial fetch when ticker symbol changes
  useEffect(() => {
    if (ticker && enabled) {
      fetchHistoricalData();
    }
  }, [ticker?.symbol, enabled, fetchHistoricalData]);

  // Update historical data with new real-time ticker prices
  useEffect(() => {
    if (!ticker || !enabled) {
      return;
    }

    // Skip if this is the same price we already processed
    if (lastTickerPriceRef.current === ticker.price) {
      return;
    }

    // Only update if we have existing data
    if (dataPointsRef.current.length > 0) {
      const newDataPoint: HistoricalDataPoint = {
        timestamp: ticker.timestamp,
        price: ticker.price,
      };

      // Add new point and maintain max length
      const updatedData = [...dataPointsRef.current, newDataPoint];
      
      // Keep only last N points
      if (updatedData.length > maxDataPoints) {
        updatedData.shift();
      }

      dataPointsRef.current = updatedData;
      setHistoricalData(updatedData);
      lastTickerPriceRef.current = ticker.price;
    }
  }, [ticker?.price, ticker?.timestamp, maxDataPoints, enabled]);

  // Clear data (useful when resetting or changing tickers)
  const clearData = useCallback(() => {
    dataPointsRef.current = [];
    setHistoricalData([]);
    setError(null);
    lastTickerPriceRef.current = null;
  }, []);

  // Manual refetch function
  const refetch = useCallback(async () => {
    await fetchHistoricalData();
  }, [fetchHistoricalData]);

  return {
    historicalData,
    isLoading,
    error,
    refetch,
    clearData,
  };
};

