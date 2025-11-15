import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '../config';
import { type Ticker } from '@/services/types/user';

interface UseWebSocketReturn {
  tickers: Ticker[];
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    // Get JWT token from localStorage
    const token = localStorage.getItem('auth_token');

    if (!token) {
      console.warn('No authentication token found');
      return;
    }

    try {
      // Create Socket.IO connection with JWT auth
      const socket = io(config.wsUrl, {
        path: config.wsPath,
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
      });

      // Connection successful
      socket.on('connect', () => {
        console.log('Socket.IO connected, Socket ID:', socket.id);
        setIsConnected(true);
        setError(null);
      });

      // Listen for price updates
      socket.on('price_update', (data: Ticker[]) => {
        setTickers(data);
      });

      // Listen for errors
      socket.on('error', (data: { message?: string }) => {
        console.error('Socket.IO error:', data);
        setError(data.message || 'WebSocket error');
      });

      // Connection error
      socket.on('connect_error', (err) => {
        console.error('Socket.IO connection error:', err.message);
        setError(`Connection error: ${err.message}`);
        setIsConnected(false);
      });

      // Disconnection
      socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected. Reason:', reason);
        setIsConnected(false);

        // Socket.IO handles reconnection automatically by default
        if (reason === 'io server disconnect') {
          // The disconnection was initiated by the server, need to reconnect manually
          socket.connect();
        }
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('Error creating Socket.IO connection:', err);
      // Set error in next tick to avoid synchronous state update
      setTimeout(() => setError('Failed to create connection'), 0);
    }
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    connect();
  }, [connect]);

  useEffect(() => {
    // Connect to Socket.IO with JWT authentication
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);

  return { tickers, isConnected, error, reconnect };
};
