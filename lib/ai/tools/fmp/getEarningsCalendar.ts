import { tool } from 'ai';
import { z } from 'zod';
import { cachedFetch } from '@/lib/fmp/cached-fetch';

interface EarningsCalendarRow {
  symbol?: string;
  date?: string;
  eps?: number | string;
  epsEstimated?: number | string;
  time?: string;
  revenue?: number | string;
  revenueEstimated?: number | string;
  updatedFromDate?: string;
  fiscalDateEnding?: string;
}

const toNumber = (val: any): number | undefined => {
  if (val === null || val === undefined || val === '') return undefined;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(num) ? undefined : num;
};

export const getEarningsCalendar = tool({
  description: `Get earnings calendar showing past and upcoming earnings dates with actual vs estimated EPS and revenue. Use this to track earnings releases and performance vs expectations.`,
  inputSchema: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., "AAPL", "MSFT", "TSLA")'),
    limit: z.number().optional().default(20).describe('Number of earnings dates to return (default: 20)'),
  }),
  execute: async ({ symbol, limit = 20 }) => {
    try {
      const data = await cachedFetch<EarningsCalendarRow[]>({
        path: 'earnings-calendar',
        params: { symbol: symbol.toUpperCase() },
        ttl: 3600, // 1 hour (earnings dates change frequently)
      });

      if (!data || data.length === 0) {
        throw new Error(`No earnings calendar data found for ${symbol}`);
      }

      // Normalize rows
      const rows = data.slice(0, limit).map(row => ({
        date: row.date || 'N/A',
        fiscalDateEnding: row.fiscalDateEnding || 'N/A',
        time: row.time || 'N/A',
        eps: toNumber(row.eps),
        epsEstimated: toNumber(row.epsEstimated),
        revenue: toNumber(row.revenue),
        revenueEstimated: toNumber(row.revenueEstimated),
      }));

      return {
        symbol: symbol.toUpperCase(),
        rows,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch earnings calendar: ${errorMessage}`);
    }
  },
});
