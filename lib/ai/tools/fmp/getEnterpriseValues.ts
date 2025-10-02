import { tool } from 'ai';
import { z } from 'zod';
import { cachedFetch } from '@/lib/fmp/cached-fetch';

interface EnterpriseValueRow {
  symbol?: string;
  date?: string;
  stockPrice?: number | string;
  numberOfShares?: number | string;
  marketCapitalization?: number | string;
  minusCashAndCashEquivalents?: number | string;
  addTotalDebt?: number | string;
  enterpriseValue?: number | string;
}

const toNumber = (val: any): number | undefined => {
  if (val === null || val === undefined || val === '') return undefined;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(num) ? undefined : num;
};

export const getEnterpriseValues = tool({
  description: `Get historical enterprise value calculations showing market cap, debt, cash, and enterprise value over time. Returns quarterly or annual data sorted from newest to oldest. Use this to analyze valuation and capital structure changes.`,
  inputSchema: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., "AAPL", "MSFT", "TSLA")'),
    period: z.enum(['annual', 'quarter']).optional().default('quarter').describe('Reporting period: "annual" for yearly data or "quarter" for quarterly data'),
    limit: z.number().optional().default(12).describe('Number of periods to return (default: 12)'),
  }),
  execute: async ({ symbol, period = 'quarter', limit = 12 }) => {
    try {
      const data = await cachedFetch<EnterpriseValueRow[]>({
        path: `enterprise-values/${symbol.toUpperCase()}`,
        params: { period, limit },
        ttl: 86400, // 24 hours
      });

      if (!data || data.length === 0) {
        throw new Error(`No enterprise value data found for ${symbol}`);
      }

      // Normalize rows
      const rows = data.map(row => ({
        date: row.date || 'N/A',
        stockPrice: toNumber(row.stockPrice),
        numberOfShares: toNumber(row.numberOfShares),
        marketCapitalization: toNumber(row.marketCapitalization),
        minusCashAndCashEquivalents: toNumber(row.minusCashAndCashEquivalents),
        addTotalDebt: toNumber(row.addTotalDebt),
        enterpriseValue: toNumber(row.enterpriseValue),
      }));

      return {
        symbol: symbol.toUpperCase(),
        period,
        rows,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch enterprise values: ${errorMessage}`);
    }
  },
});
