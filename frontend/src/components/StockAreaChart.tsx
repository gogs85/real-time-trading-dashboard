import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface StockAreaChartProps {
  data: Array<{
    timestamp: number;
    date: string;
    price: number;
  }>;
  width?: number;
  height?: number;
}

export function StockAreaChart ({ data, ...props }: StockAreaChartProps) {
  return (
    <AreaChart data={data} {...props}>
      <defs>
        <linearGradient id='fillPrice' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='5%' stopColor='var(--color-price)' stopOpacity={0.8} />
          <stop offset='95%' stopColor='var(--color-price)' stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey='timestamp'
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        minTickGap={32}
        tickFormatter={value => {
          const date = new Date(value);
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        tickFormatter={value => `$${value}`}
      />
      <ChartTooltip
        cursor={false}
        content={
          <ChartTooltipContent
            labelFormatter={value => {
              const timestamp = typeof value === 'number' ? value : Number(value);
              return new Date(timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
            }}
            formatter={value => [`$${Number(value).toFixed(2)}`, ' Price']}
            indicator='dot'
          />
        }
      />
      <Area
        dataKey='price'
        type='monotone'
        fill='url(#fillPrice)'
        stroke='var(--color-price)'
        strokeWidth={2}
      />
    </AreaChart>
  );
}
