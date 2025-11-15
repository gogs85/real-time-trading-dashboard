import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { TickerDetail } from './TickerDetail';
import { apiService } from '@/services/api';

// Mock the API service
vi.mock('@/services/api', () => ({
  apiService: {
    getTicker: vi.fn(),
  },
}));

// Mock child components
vi.mock('../app-sidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar">App Sidebar</div>,
}));

vi.mock('../site-header', () => ({
  SiteHeader: () => <div data-testid="site-header">Site Header</div>,
}));

vi.mock('../chart-area-interactive', () => ({
  ChartAreaInteractive: ({ ticker }: { ticker: any }) => (
    <div data-testid="chart-area">Chart for {ticker?.symbol}</div>
  ),
}));

vi.mock('../ui/sidebar', () => ({
  SidebarInset: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-inset">{children}</div>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span>←</span>,
  TrendingUp: () => <span>↑</span>,
  TrendingDown: () => <span>↓</span>,
}));

const mockTicker = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  price: 175.5,
  change: 2.5,
  changePercent: 1.45,
  timestamp: Date.now(),
};

describe('TickerDetail Page', () => {
  const renderTickerDetail = (symbol: string = 'AAPL') => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/ticker/:symbol" element={<TickerDetail />} />
        </Routes>
      </BrowserRouter>,
      { initialEntries: [`/ticker/${symbol}`] } as any
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching data', () => {
      vi.mocked(apiService.getTicker).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderTickerDetail();

      expect(screen.getByText(/loading ticker data/i)).toBeInTheDocument();
    });

    it('should render sidebar and header during loading', () => {
      vi.mocked(apiService.getTicker).mockImplementation(
        () => new Promise(() => {})
      );

      renderTickerDetail();

      expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('site-header')).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('should display ticker data when loaded successfully', async () => {
      vi.mocked(apiService.getTicker).mockResolvedValue({
        ticker: mockTicker,
      });

      renderTickerDetail();

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument();
      });

      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
      expect(screen.getByText(/\$175\.50/)).toBeInTheDocument();
    });

    it('should show positive change indicator for positive price change', async () => {
      vi.mocked(apiService.getTicker).mockResolvedValue({
        ticker: mockTicker,
      });

      renderTickerDetail();

      await waitFor(() => {
        expect(screen.getByText(/1\.45%/)).toBeInTheDocument();
      });
    });

    it('should show negative change indicator for negative price change', async () => {
      const negativeTicker = {
        ...mockTicker,
        change: -2.5,
        changePercent: -1.45,
      };

      vi.mocked(apiService.getTicker).mockResolvedValue({
        ticker: negativeTicker,
      });

      renderTickerDetail();

      await waitFor(() => {
        expect(screen.getByText(/-1\.45%/)).toBeInTheDocument();
      });
    });

    it('should render chart with ticker data', async () => {
      vi.mocked(apiService.getTicker).mockResolvedValue({
        ticker: mockTicker,
      });

      renderTickerDetail();

      await waitFor(() => {
        expect(screen.getByTestId('chart-area')).toHaveTextContent('Chart for AAPL');
      });
    });

    it('should display formatted timestamp', async () => {
      vi.mocked(apiService.getTicker).mockResolvedValue({
        ticker: mockTicker,
      });

      renderTickerDetail();

      await waitFor(() => {
        expect(screen.getByText(/Last Updated/)).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should show error message when fetch fails', async () => {
      vi.mocked(apiService.getTicker).mockRejectedValue(
        new Error('Network error')
      );

      renderTickerDetail();

      await waitFor(() => {
        expect(screen.getByText(/failed to load ticker data/i)).toBeInTheDocument();
      });
    });

    it('should show error message when ticker is not found', async () => {
      vi.mocked(apiService.getTicker).mockResolvedValue({
        ticker: null,
      });

      renderTickerDetail();

      await waitFor(() => {
        expect(screen.getByText(/ticker not found/i)).toBeInTheDocument();
      });
    });

    it('should show back button in error state', async () => {
      vi.mocked(apiService.getTicker).mockRejectedValue(
        new Error('Network error')
      );

      renderTickerDetail();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should render back to dashboard button', async () => {
      vi.mocked(apiService.getTicker).mockResolvedValue({
        ticker: mockTicker,
      });

      renderTickerDetail();

      await waitFor(() => {
        const backButtons = screen.getAllByRole('button', { name: /back to dashboard/i });
        expect(backButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Symbol Parameter', () => {
    it('should fetch ticker data with correct symbol', async () => {
      vi.mocked(apiService.getTicker).mockResolvedValue({
        ticker: mockTicker,
      });

      renderTickerDetail('TSLA');

      await waitFor(() => {
        expect(apiService.getTicker).toHaveBeenCalledWith('TSLA');
      });
    });

    it('should handle missing symbol parameter', async () => {
      vi.mocked(apiService.getTicker).mockResolvedValue({
        ticker: null,
      });

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/ticker/:symbol?" element={<TickerDetail />} />
          </Routes>
        </BrowserRouter>,
        { initialEntries: ['/ticker/'] } as any
      );

      await waitFor(() => {
        expect(screen.getByText(/no ticker symbol provided|ticker not found/i)).toBeInTheDocument();
      });
    });
  });
});

