
import { useState, useEffect, useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { useTickerHistory } from "@/hooks/useTickerHistory"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

import { Button } from "./ui/button"
import { DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from "./ui/dropdown-menu"
import { apiService } from "@/services/api"
import type { Ticker } from "@/services/types/user"

export const description = "An interactive area chart"

const chartConfig = {
  price: {
    label: "Price",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = useState("90d")
  const [tickers, setTickers] = useState<Ticker[]>([])
  const [isLoadingTickers, setIsLoadingTickers] = useState(true)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)


  useEffect(() => {
    const fetchTickers = async () => {
      try {
        setIsLoadingTickers(true)
        const response = await apiService.getTickers()
        setTickers(response.tickers)
        if (response.tickers.length > 0) {
          setSelectedSymbol(response.tickers[0].symbol)
        }
      } catch (error) {
        console.error('Failed to fetch tickers:', error)
      } finally {
        setIsLoadingTickers(false)
      }
    }

    fetchTickers()
  }, [])

  const selectedTicker = tickers.find(t => t.symbol === selectedSymbol) || null


  const dataPoints = useMemo(() => {
    switch (timeRange) {
      case "7d":
        return 500
      case "30d":
        return 1000
      case "90d":
      default:
        return 2000
    }
  }, [timeRange])

  const {
    historicalData,
    isLoading: isLoadingHistory,
    error: historyError
  } = useTickerHistory(selectedTicker, {
    maxDataPoints: dataPoints,
    enabled: !!selectedTicker
  })

  useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])


  const chartFormattedData = historicalData.map(point => ({
    timestamp: point.timestamp,
    date: new Date(point.timestamp).toISOString(),
    price: point.price,
  }))

  const filteredData = chartFormattedData.filter((item) => {
    const date = new Date(item.timestamp)
    const now = Date.now()
    let millisecondsToSubtract = 90 * 24 * 60 * 60 * 1000 // 90 days
    if (timeRange === "30d") {
      millisecondsToSubtract = 30 * 24 * 60 * 60 * 1000
    } else if (timeRange === "7d") {
      millisecondsToSubtract = 7 * 24 * 60 * 60 * 1000
    }
    const startTime = now - millisecondsToSubtract
    return date.getTime() >= startTime
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Chart</CardTitle>
        <CardDescription>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isLoadingTickers}>
                  {isLoadingTickers 
                    ? 'Loading...' 
                    : selectedTicker
                      ? `${selectedTicker.symbol} - ${selectedTicker.name}`
                      : 'Select Ticker'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                {tickers.length === 0 && !isLoadingTickers ? (
                  <DropdownMenuItem disabled>No tickers available</DropdownMenuItem>
                ) : (
                  tickers.map((ticker) => (
                    <DropdownMenuItem
                      key={ticker.symbol}
                      onClick={() => setSelectedSymbol(ticker.symbol)}
                    >
                      {ticker.symbol} - {ticker.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {isLoadingHistory && <span className="text-sm text-muted-foreground">Loading data...</span>}
            {historyError && <span className="text-sm text-destructive">{historyError}</span>}
          </div>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          {filteredData.length === 0 && !isLoadingHistory ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              {selectedTicker ? 'No data available for this time range' : 'Select a ticker to view chart'}
            </div>
          ) : (
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-price)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-price)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, "Price"]}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="price"
                type="monotone"
                fill="url(#fillPrice)"
                stroke="var(--color-price)"
                strokeWidth={2}
              />
            </AreaChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
