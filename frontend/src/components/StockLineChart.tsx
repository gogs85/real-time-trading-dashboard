import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface StockLineChartProps {
  data: Array<{
    timestamp: number;
    date: string;
    price: number;
  }>;
  width?: number;
  height?: number;
}

export function StockLineChart ({ data, ...props }: StockLineChartProps) {
  return (
    <LineChart data={data} {...props}>
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
            labelFormatter={(_, payload) => {
              return new Date(payload?.[0]?.payload?.timestamp).toLocaleString('en-US', {
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
      <Line
        dataKey='price'
        type='monotone'
        stroke='var(--color-price)'
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  );
}
