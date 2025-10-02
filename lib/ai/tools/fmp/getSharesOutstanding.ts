import { tool } from 'ai';
import { z } from 'zod';
import { cachedFetch } from '@/lib/fmp/cached-fetch';

interface SharesOutstandingRow {
  symbol?: string;
  date?: string;
  freeFloat?: number | string;
  floatShares?: number | string;
  outstandingShares?: number | string;
  source?: string;
}

const toNumber = (val: any): number | undefined => {
  if (val === null || val === undefined || val === '') return undefined;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(num) ? undefined : num;
};

export const getSharesOutstanding = tool({
  description: `Get historical shares outstanding data showing total shares and float over time. Returns data sorted from newest to oldest. Use this to track dilution and share count changes.`,
  inputSchema: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., "AAPL", "MSFT", "TSLA")'),
  }),
  execute: async ({ symbol }) => {
    try {
      const data = await cachedFetch<SharesOutstandingRow[]>({
        path: `shares_float/${symbol.toUpperCase()}`,
        params: {},
        ttl: 86400, // 24 hours
      });

      if (!data || data.length === 0) {
        throw new Error(`No shares outstanding data found for ${symbol}`);
      }

      // Normalize rows
      const rows = data.map(row => ({
        date: row.date || 'N/A',
        outstandingShares: toNumber(row.outstandingShares),
        floatShares: toNumber(row.floatShares) ?? toNumber(row.freeFloat),
        source: row.source || 'N/A',
      }));

      return {
        symbol: symbol.toUpperCase(),
        rows,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch shares outstanding: ${errorMessage}`);
    }
  },
});
