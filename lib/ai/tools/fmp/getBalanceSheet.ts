import { tool } from 'ai';
import { z } from 'zod';
import { cachedFetch } from '@/lib/fmp/cached-fetch';

interface BalanceSheetRow {
  date?: string;
  symbol?: string;
  reportedCurrency?: string;
  cik?: string;
  fillingDate?: string;
  acceptedDate?: string;
  calendarYear?: string;
  period?: string;
  cashAndCashEquivalents?: number | string;
  shortTermInvestments?: number | string;
  cashAndShortTermInvestments?: number | string;
  netReceivables?: number | string;
  inventory?: number | string;
  otherCurrentAssets?: number | string;
  totalCurrentAssets?: number | string;
  propertyPlantEquipmentNet?: number | string;
  goodwill?: number | string;
  intangibleAssets?: number | string;
  goodwillAndIntangibleAssets?: number | string;
  longTermInvestments?: number | string;
  taxAssets?: number | string;
  otherNonCurrentAssets?: number | string;
  totalNonCurrentAssets?: number | string;
  otherAssets?: number | string;
  totalAssets?: number | string;
  accountPayables?: number | string;
  shortTermDebt?: number | string;
  taxPayables?: number | string;
  deferredRevenue?: number | string;
  otherCurrentLiabilities?: number | string;
  totalCurrentLiabilities?: number | string;
  longTermDebt?: number | string;
  deferredRevenueNonCurrent?: number | string;
  deferredTaxLiabilitiesNonCurrent?: number | string;
  otherNonCurrentLiabilities?: number | string;
  totalNonCurrentLiabilities?: number | string;
  otherLiabilities?: number | string;
  capitalLeaseObligations?: number | string;
  totalLiabilities?: number | string;
  preferredStock?: number | string;
  commonStock?: number | string;
  retainedEarnings?: number | string;
  accumulatedOtherComprehensiveIncomeLoss?: number | string;
  othertotalStockholdersEquity?: number | string;
  totalStockholdersEquity?: number | string;
  totalEquity?: number | string;
  totalLiabilitiesAndStockholdersEquity?: number | string;
  minorityInterest?: number | string;
  totalLiabilitiesAndTotalEquity?: number | string;
  totalInvestments?: number | string;
  totalDebt?: number | string;
  netDebt?: number | string;
  link?: string;
  finalLink?: string;
}

const toNumber = (val: any): number | undefined => {
  if (val === null || val === undefined || val === '') return undefined;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(num) ? undefined : num;
};

export const getBalanceSheet = tool({
  description: `Get balance sheet data showing assets, liabilities, and equity. Returns quarterly or annual data sorted from newest to oldest. Use this to analyze financial position, liquidity, and capital structure.`,
  inputSchema: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., "AAPL", "MSFT", "TSLA")'),
    period: z.enum(['annual', 'quarter']).optional().default('quarter').describe('Reporting period: "annual" for yearly data or "quarter" for quarterly data'),
    limit: z.number().optional().default(12).describe('Number of periods to return (default: 12)'),
  }),
  execute: async ({ symbol, period = 'quarter', limit = 12 }) => {
    try {
      const data = await cachedFetch<BalanceSheetRow[]>({
        path: `balance-sheet-statement/${symbol.toUpperCase()}`,
        params: { period, limit },
        ttl: 86400, // 24 hours
      });

      if (!data || data.length === 0) {
        throw new Error(`No balance sheet data found for ${symbol}`);
      }

      // Normalize rows and compute totalDebt if missing
      const rows = data.map(row => {
        const shortTermDebt = toNumber(row.shortTermDebt);
        const longTermDebt = toNumber(row.longTermDebt);
        const totalDebt = toNumber(row.totalDebt) ??
          ((shortTermDebt !== undefined || longTermDebt !== undefined)
            ? (shortTermDebt ?? 0) + (longTermDebt ?? 0)
            : undefined);

        return {
          date: row.date || 'N/A',
          period: row.period || period,
          calendarYear: row.calendarYear || 'N/A',
          cashAndCashEquivalents: toNumber(row.cashAndCashEquivalents),
          shortTermInvestments: toNumber(row.shortTermInvestments),
          cashAndShortTermInvestments: toNumber(row.cashAndShortTermInvestments),
          netReceivables: toNumber(row.netReceivables),
          inventory: toNumber(row.inventory),
          totalCurrentAssets: toNumber(row.totalCurrentAssets),
          propertyPlantEquipmentNet: toNumber(row.propertyPlantEquipmentNet),
          goodwill: toNumber(row.goodwill),
          intangibleAssets: toNumber(row.intangibleAssets),
          longTermInvestments: toNumber(row.longTermInvestments),
          totalNonCurrentAssets: toNumber(row.totalNonCurrentAssets),
          totalAssets: toNumber(row.totalAssets),
          accountPayables: toNumber(row.accountPayables),
          shortTermDebt,
          totalCurrentLiabilities: toNumber(row.totalCurrentLiabilities),
          longTermDebt,
          totalNonCurrentLiabilities: toNumber(row.totalNonCurrentLiabilities),
          totalLiabilities: toNumber(row.totalLiabilities),
          commonStock: toNumber(row.commonStock),
          retainedEarnings: toNumber(row.retainedEarnings),
          totalStockholdersEquity: toNumber(row.totalStockholdersEquity),
          totalEquity: toNumber(row.totalEquity),
          totalDebt,
          netDebt: toNumber(row.netDebt),
        };
      });

      return {
        symbol: symbol.toUpperCase(),
        period,
        rows,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch balance sheet: ${errorMessage}`);
    }
  },
});
