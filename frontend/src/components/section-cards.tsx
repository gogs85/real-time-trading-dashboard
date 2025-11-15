import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useWebSocket } from '@/hooks/useWebSocket';

export function SectionCards () {
  const { tickers, error, reconnect } = useWebSocket();
  const navigate = useNavigate();

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
      {error && (
        <div className='error-banner'>
          <span>{error}</span>
          <button onClick={reconnect}>Retry</button>
        </div>
      )}
      {tickers.map(ticker => (
        <Card
          key={ticker.symbol}
          className='max-w-sm cursor-pointer transition-transform hover:scale-105'
          onClick={() => navigate(`/ticker/${ticker.symbol}`)}
        >
          <CardHeader>
            <CardDescription>{ticker.symbol}</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
              ${ticker.price}
            </CardTitle>
            <CardAction>
              <Badge variant='outline'>
                {ticker.change > 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                {ticker.change}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className='flex-col items-start p-0  text-sm'>
            <div className='line-clamp-1 flex font-medium'>{ticker.name}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
