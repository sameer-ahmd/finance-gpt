import { tool } from 'ai';
import { z } from 'zod';
import { cachedFetch } from '@/lib/fmp/cached-fetch';

interface ProfileResponse {
  symbol?: string;
  price?: number;
  beta?: number;
  volAvg?: number;
  mktCap?: number;
  lastDiv?: number;
  range?: string;
  changes?: number;
  companyName?: string;
  currency?: string;
  cik?: string;
  isin?: string;
  cusip?: string;
  exchange?: string;
  exchangeShortName?: string;
  industry?: string;
  website?: string;
  description?: string;
  ceo?: string;
  sector?: string;
  country?: string;
  fullTimeEmployees?: string | number;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  dcfDiff?: number;
  dcf?: number;
  image?: string;
  ipoDate?: string;
  defaultImage?: boolean;
  isEtf?: boolean;
  isActivelyTrading?: boolean;
  isAdr?: boolean;
  isFund?: boolean;
}

const toNumber = (val: any): number | undefined => {
  if (val === null || val === undefined || val === '') return undefined;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(num) ? undefined : num;
};

export const getCompanyProfile = tool({
  description: `Get detailed company profile information including business description, sector, industry, executive leadership, contact details, and key stock metrics. Use this to understand what a company does and get basic stock information.`,
  inputSchema: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., "AAPL", "MSFT", "TSLA")'),
  }),
  execute: async ({ symbol }) => {
    try {
      const data = await cachedFetch<ProfileResponse[]>({
        path: `profile/${symbol.toUpperCase()}`,
        params: {},
        ttl: 86400, // 24 hours
      });

      if (!data || data.length === 0) {
        throw new Error(`No profile found for symbol ${symbol}`);
      }

      const profile = data[0];

      // Normalize the response
      return {
        symbol: profile.symbol || symbol.toUpperCase(),
        companyName: profile.companyName || 'N/A',
        price: toNumber(profile.price),
        currency: profile.currency || 'USD',
        exchange: profile.exchangeShortName || profile.exchange || 'N/A',
        marketCap: toNumber(profile.mktCap),
        sector: profile.sector || 'N/A',
        industry: profile.industry || 'N/A',
        description: profile.description || 'N/A',
        ceo: profile.ceo || 'N/A',
        employees: toNumber(profile.fullTimeEmployees),
        website: profile.website || 'N/A',
        country: profile.country || 'N/A',
        ipoDate: profile.ipoDate || 'N/A',
        beta: toNumber(profile.beta),
        priceRange: profile.range || 'N/A',
        averageVolume: toNumber(profile.volAvg),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch company profile: ${errorMessage}`);
    }
  },
});
