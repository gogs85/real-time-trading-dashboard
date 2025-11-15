import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import type { Ticker } from '@/services/types/user';
import { SiteHeader } from '../site-header';
import { AppSidebar } from '../app-sidebar';
import { SidebarInset } from '../ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { ChartAreaInteractive } from '../chart-area-interactive';

export function TickerDetail () {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicker = async () => {
      if (!symbol) {
        setError('No ticker symbol provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await apiService.getTicker(symbol);
        setTicker(response.ticker);
      } catch (err) {
        console.error('Failed to fetch ticker:', err);
        setError('Failed to load ticker data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicker();
  }, [symbol]);

  if (isLoading) {
    return (
      <>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className='flex h-[calc(100vh-4rem)] items-center justify-center'>
            <div className='text-center'>
              <div className='loading-spinner mx-auto mb-4' />
              <p className='text-muted-foreground'>Loading ticker data...</p>
            </div>
          </div>
        </SidebarInset>
      </>
    );
  }

  if (error || !ticker) {
    return (
      <>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
            <Card className='mt-14'>
              <CardContent className='flex flex-col items-center justify-center py-10'>
                <p className='text-destructive mb-4'>{error || 'Ticker not found'}</p>
                <Button onClick={() => navigate('/dashboard')}>
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </>
    );
  }

  const priceChange = ticker.change;
  const priceChangePercent = ticker.changePercent.toFixed(2);
  const isPositive = priceChange >= 0;

  return (
    <>
      <AppSidebar variant='inset' />
      <SidebarInset>
        <SiteHeader />
        <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
          {/* Back Button */}
          <div className='flex items-center gap-2 mt-14'>
            <Button variant='ghost' size='sm' onClick={() => navigate('/dashboard')}>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Dashboard
            </Button>
          </div>

          {/* Ticker Header */}
          <Card>
            <CardHeader>
              <div className='flex items-start justify-between'>
                <div>
                  <CardTitle className='text-3xl'>{ticker.symbol}</CardTitle>
                  <CardDescription className='text-lg'>{ticker.name}</CardDescription>
                </div>
                <Badge
                  variant={isPositive ? 'default' : 'destructive'}
                  className={`text-lg px-4 py-2 ${isPositive ? 'bg-green-600' : 'bg-red-600'}`}
                >
                  {isPositive ? (
                    <TrendingUp className='mr-1 h-4 w-4' />
                  ) : (
                    <TrendingDown className='mr-1 h-4 w-4' />
                  )}
                  {isPositive ? '+' : ''}
                  {priceChangePercent}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
                <div>
                  <p className='text-sm text-muted-foreground'>Current Price</p>
                  <p className='text-2xl font-bold'>${ticker.price.toFixed(2)}</p>
                </div>

                <div className='col-span-2 md:col-span-3'>
                  <p className='text-sm text-muted-foreground'>Last Updated</p>
                  <p className='text-sm'>
                    {new Date(ticker.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <ChartAreaInteractive ticker={ticker} showTickerSelector={false} />
        </div>
      </SidebarInset>
    </>
  );
}
