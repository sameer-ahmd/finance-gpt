import { tool } from 'ai';
import { z } from 'zod';
import { cachedFetch } from '@/lib/fmp/cached-fetch';

interface SearchResult {
  symbol: string;
  name: string;
  currency?: string;
  stockExchange?: string;
  exchangeShortName?: string;
}

export const searchCompany = tool({
  description: `Search for companies by name or ticker symbol. Returns a list of matching companies with their ticker symbols and basic information. Use this when you need to find the correct ticker symbol for a company.`,
  inputSchema: z.object({
    query: z.string().describe('Company name or partial ticker symbol to search for (e.g., "Apple", "AAPL", "Tesla")'),
  }),
  execute: async ({ query }) => {
    try {
      const data = await cachedFetch<SearchResult[]>({
        path: 'search',
        params: { query },
        ttl: 86400 * 7, // Cache for 7 days (company names don't change often)
      });

      if (!data || data.length === 0) {
        return {
          query,
          results: [],
          message: `No companies found matching "${query}"`,
        };
      }

      // Normalize and limit results
      const results = data.slice(0, 10).map(item => ({
        symbol: item.symbol,
        name: item.name,
        exchange: item.exchangeShortName || item.stockExchange || 'N/A',
        currency: item.currency || 'USD',
      }));

      return {
        query,
        results,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to search companies: ${errorMessage}`);
    }
  },
});
