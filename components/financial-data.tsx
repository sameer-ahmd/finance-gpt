"use client";

import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

type FinancialDataProps = {
  financialData: string | {
    content: string;
    data: Array<{ date: string; value: number }>;
    ticker: string;
    metric: string;
    period: string;
  };
};

type ParsedFinancialData = {
  ticker: string;
  metric: string;
  period: string;
  data: Array<{ date: string; value: number; year: string }>;
  growth: Array<{ period: string; cagr: number }>;
};

function parseFinancialData(rawData: string | object): ParsedFinancialData | null {
  // Handle new object format
  if (typeof rawData === 'object' && 'content' in rawData && 'data' in rawData) {
    const obj = rawData as {
      content: string;
      data: Array<{ date: string; value: number }>;
      ticker: string;
      metric: string;
      period: string;
    };

    const data = obj.data.map((item) => ({
      ...item,
      year: item.date.split('-')[0]
    }));

    // No CAGR in the new format - it will be calculated by the separate tool
    const growth: Array<{ period: string; cagr: number }> = [];

    return { ticker: obj.ticker, metric: obj.metric, period: obj.period, data, growth };
  }

  // Handle legacy string format
  if (typeof rawData !== 'string') return null;
  try {
    // Extract ticker and metric from the header
    const headerMatch = rawData.match(/\*\*([A-Z]+)\s+(\w+)\s+\((\w+)\)\*\*/);
    if (!headerMatch) return null;
    
    const [, ticker, metric, period] = headerMatch;
    
    // Extract table data
    const lines = rawData.split('\n');
    const tableStart = lines.findIndex(line => line.includes('|------|'));
    if (tableStart === -1) return null;
    
    const data: Array<{ date: string; value: number; year: string }> = [];
    for (let i = tableStart + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('|') || !line.includes('|')) break;
      
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 2) {
        const date = parts[0];
        const valueStr = parts[1].replace(/,/g, '');
        const value = parseFloat(valueStr);
        if (!isNaN(value)) {
          data.push({ 
            date, 
            value, 
            year: date.split('-')[0] // Extract year for chart display
          });
        }
      }
    }
    
    // Extract growth data
    const growth: Array<{ period: string; cagr: number }> = [];
    const growthMatch = rawData.match(/(\d+y CAGR: [-+]?\d+\.\d+%)/g);
    if (growthMatch) {
      for (const match of growthMatch) {
        const parts = match.match(/(\d+)y CAGR: ([-+]?\d+\.\d+)%/);
        if (parts) {
          growth.push({
            period: `${parts[1]}Y`,
            cagr: parseFloat(parts[2])
          });
        }
      }
    }
    
    return { ticker, metric, period, data, growth };
  } catch {
    return null;
  }
}

function formatValue(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

function formatChartValue(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  return value.toLocaleString();
}

export function FinancialData({ financialData }: FinancialDataProps) {
  const parsedData = useMemo(() => parseFinancialData(financialData), [financialData]);

  if (!parsedData) {
    // Fallback to raw markdown display
    return (
      <Card className="max-w-[600px]">
        <CardContent className="p-4">
          <div className="whitespace-pre-wrap font-mono text-sm">
            {typeof financialData === 'string' ? financialData : financialData.content}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { ticker, metric, period, data, growth } = parsedData;
  const latestData = data[data.length - 1];
  const previousData = data[data.length - 2];
  
  const isPositiveChange = latestData && previousData 
    ? latestData.value > previousData.value 
    : true;

  const displayMetric = metric === 'netIncome' ? 'Net Income' 
    : metric === 'freeCashFlow' ? 'Free Cash Flow'
    : metric.charAt(0).toUpperCase() + metric.slice(1);

  // Chart configuration
  const chartConfig = {
    value: {
      label: displayMetric,
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card className="max-w-[600px]">
      <CardHeader className="pb-4">
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">{ticker}</CardTitle>
            <CardDescription className="text-base">
              {displayMetric} • {period.charAt(0).toUpperCase() + period.slice(1)}
            </CardDescription>
          </div>
          
          {latestData && (
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatValue(latestData.value)}
              </div>
              <div className="text-muted-foreground text-sm">
                {latestData.date}
              </div>
            </div>
          )}
        </div>

        {/* Growth Metrics */}
        {growth.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {growth.map(({ period: growthPeriod, cagr }) => (
              <div
                key={growthPeriod}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium",
                  cagr >= 0
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                    : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                )}
              >
                {cagr >= 0 ? (
                  <TrendingUpIcon className="size-3" />
                ) : (
                  <TrendingDownIcon className="size-3" />
                )}
                <span>{growthPeriod}: {cagr.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Chart */}
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis 
                dataKey="year"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                hide={true}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [formatValue(Number(value)), displayMetric]}
                    labelFormatter={(label) => `Year: ${label}`}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="white"
                strokeWidth={2}
                dot={{ 
                  fill: "hsl(var(--foreground))", 
                  strokeWidth: 0, 
                  r: 4 
                }}
                activeDot={{ 
                  r: 6, 
                  fill: "hsl(var(--foreground))",
                  strokeWidth: 0
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
          <div className="space-y-1">
            <div className="text-muted-foreground text-sm">Latest Value</div>
            <div className="text-lg font-semibold">
              {latestData ? formatValue(latestData.value) : 'N/A'}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-muted-foreground text-sm">Trend</div>
            <div className="flex items-center gap-2">
              {latestData && previousData && (
                <>
                  {isPositiveChange ? (
                    <TrendingUpIcon className="size-4 text-green-600" />
                  ) : (
                    <TrendingDownIcon className="size-4 text-red-600" />
                  )}
                  <span className="text-lg font-semibold">
                    {isPositiveChange ? "Growing" : "Declining"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
