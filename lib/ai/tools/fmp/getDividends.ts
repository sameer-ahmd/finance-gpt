import { tool } from 'ai';
import { z } from 'zod';
import { cachedFetch } from '@/lib/fmp/cached-fetch';

interface DividendResponse {
  historical?: DividendRow[];
  symbol?: string;
}

interface DividendRow {
  date?: string;
  label?: string;
  adjDividend?: number | string;
  dividend?: number | string;
  recordDate?: string;
  paymentDate?: string;
  declarationDate?: string;
}

const toNumber = (val: any): number | undefined => {
  if (val === null || val === undefined || val === '') return undefined;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(num) ? undefined : num;
};

export const getDividends = tool({
  description: `Get historical dividend payments showing dividend amounts and key dates (declaration, record, payment). Returns data sorted from newest to oldest. Use this to analyze dividend history and payment patterns.`,
  inputSchema: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., "AAPL", "MSFT", "JNJ")'),
    limit: z.number().optional().default(20).describe('Number of dividend records to return (default: 20)'),
  }),
  execute: async ({ symbol, limit = 20 }) => {
    try {
      const data = await cachedFetch<DividendResponse>({
        path: `historical-price-full/stock_dividend/${symbol.toUpperCase()}`,
        params: {},
        ttl: 86400, // 24 hours
      });

      if (!data || !data.historical || data.historical.length === 0) {
        return {
          symbol: symbol.toUpperCase(),
          rows: [],
          message: `No dividend history found for ${symbol}. This company may not pay dividends.`,
        };
      }

      // Normalize rows
      const rows = data.historical.slice(0, limit).map(row => ({
        date: row.date || 'N/A',
        label: row.label || 'N/A',
        dividend: toNumber(row.adjDividend) ?? toNumber(row.dividend),
        declarationDate: row.declarationDate || 'N/A',
        recordDate: row.recordDate || 'N/A',
        paymentDate: row.paymentDate || 'N/A',
      }));

      return {
        symbol: symbol.toUpperCase(),
        rows,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch dividend history: ${errorMessage}`);
    }
  },
});
