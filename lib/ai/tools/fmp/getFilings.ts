import { tool } from 'ai';
import { z } from 'zod';
import { cachedFetch } from '@/lib/fmp/cached-fetch';

interface FilingRow {
  symbol?: string;
  cik?: string;
  title?: string;
  date?: string;
  type?: string;
  link?: string;
  finalLink?: string;
  acceptedDate?: string;
}

export const getFilings = tool({
  description: `Get recent SEC filings (10-K, 10-Q, 8-K, etc.) for a company. Returns filing information with links to the documents. Use this to access regulatory disclosures and official company reports.`,
  inputSchema: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., "AAPL", "MSFT", "TSLA")'),
    filingType: z.string().optional().describe('Specific filing type to filter (e.g., "10-K", "10-Q", "8-K"). Leave empty for all filings.'),
    limit: z.number().optional().default(20).describe('Number of filings to return (default: 20)'),
  }),
  execute: async ({ symbol, filingType, limit = 20 }) => {
    try {
      const params: Record<string, string | number> = {};
      if (filingType) {
        params.type = filingType;
      }

      const data = await cachedFetch<FilingRow[]>({
        path: `sec_filings/${symbol.toUpperCase()}`,
        params,
        ttl: 3600, // 1 hour
      });

      if (!data || data.length === 0) {
        throw new Error(`No SEC filings found for ${symbol}`);
      }

      // Normalize rows
      const rows = data.slice(0, limit).map(row => ({
        date: row.date || row.acceptedDate || 'N/A',
        type: row.type || 'N/A',
        title: row.title || 'N/A',
        link: row.finalLink || row.link || 'N/A',
      }));

      return {
        symbol: symbol.toUpperCase(),
        filingType: filingType || 'all',
        rows,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch SEC filings: ${errorMessage}`);
    }
  },
});
