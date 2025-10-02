import { tool } from 'ai';
import { z } from 'zod';
import { cachedFetch } from '@/lib/fmp/cached-fetch';

interface RatiosRow {
  symbol?: string;
  date?: string;
  calendarYear?: string;
  period?: string;
  currentRatio?: number | string;
  quickRatio?: number | string;
  cashRatio?: number | string;
  daysOfSalesOutstanding?: number | string;
  daysOfInventoryOutstanding?: number | string;
  operatingCycle?: number | string;
  daysOfPayablesOutstanding?: number | string;
  cashConversionCycle?: number | string;
  grossProfitMargin?: number | string;
  operatingProfitMargin?: number | string;
  pretaxProfitMargin?: number | string;
  netProfitMargin?: number | string;
  effectiveTaxRate?: number | string;
  returnOnAssets?: number | string;
  returnOnEquity?: number | string;
  returnOnCapitalEmployed?: number | string;
  netIncomePerEBT?: number | string;
  ebtPerEbit?: number | string;
  ebitPerRevenue?: number | string;
  debtRatio?: number | string;
  debtEquityRatio?: number | string;
  longTermDebtToCapitalization?: number | string;
  totalDebtToCapitalization?: number | string;
  interestCoverage?: number | string;
  cashFlowToDebtRatio?: number | string;
  companyEquityMultiplier?: number | string;
  receivablesTurnover?: number | string;
  payablesTurnover?: number | string;
  inventoryTurnover?: number | string;
  fixedAssetTurnover?: number | string;
  assetTurnover?: number | string;
  operatingCashFlowPerShare?: number | string;
  freeCashFlowPerShare?: number | string;
  cashPerShare?: number | string;
  payoutRatio?: number | string;
  operatingCashFlowSalesRatio?: number | string;
  freeCashFlowOperatingCashFlowRatio?: number | string;
  cashFlowCoverageRatios?: number | string;
  shortTermCoverageRatios?: number | string;
  capitalExpenditureCoverageRatio?: number | string;
  dividendPaidAndCapexCoverageRatio?: number | string;
  dividendPayoutRatio?: number | string;
  priceBookValueRatio?: number | string;
  priceToBookRatio?: number | string;
  priceToSalesRatio?: number | string;
  priceEarningsRatio?: number | string;
  priceToFreeCashFlowsRatio?: number | string;
  priceToOperatingCashFlowsRatio?: number | string;
  priceCashFlowRatio?: number | string;
  priceEarningsToGrowthRatio?: number | string;
  priceSalesRatio?: number | string;
  dividendYield?: number | string;
  enterpriseValueMultiple?: number | string;
  priceFairValue?: number | string;
}

const toNumber = (val: any): number | undefined => {
  if (val === null || val === undefined || val === '') return undefined;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(num) ? undefined : num;
};

export const getRatios = tool({
  description: `Get comprehensive financial ratios including liquidity, profitability, leverage, efficiency, and valuation metrics. Returns quarterly or annual data sorted from newest to oldest. Use this to analyze financial health and compare companies.`,
  inputSchema: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., "AAPL", "MSFT", "TSLA")'),
    period: z.enum(['annual', 'quarter']).optional().default('quarter').describe('Reporting period: "annual" for yearly data or "quarter" for quarterly data'),
    limit: z.number().optional().default(12).describe('Number of periods to return (default: 12)'),
  }),
  execute: async ({ symbol, period = 'quarter', limit = 12 }) => {
    try {
      const data = await cachedFetch<RatiosRow[]>({
        path: `ratios/${symbol.toUpperCase()}`,
        params: { period, limit },
        ttl: 86400, // 24 hours
      });

      if (!data || data.length === 0) {
        throw new Error(`No ratios data found for ${symbol}`);
      }

      // Normalize rows
      const rows = data.map(row => ({
        date: row.date || 'N/A',
        period: row.period || period,
        calendarYear: row.calendarYear || 'N/A',
        // Liquidity ratios
        currentRatio: toNumber(row.currentRatio),
        quickRatio: toNumber(row.quickRatio),
        cashRatio: toNumber(row.cashRatio),
        // Operating efficiency
        daysOfSalesOutstanding: toNumber(row.daysOfSalesOutstanding),
        daysOfInventoryOutstanding: toNumber(row.daysOfInventoryOutstanding),
        cashConversionCycle: toNumber(row.cashConversionCycle),
        // Profitability margins
        grossProfitMargin: toNumber(row.grossProfitMargin),
        operatingProfitMargin: toNumber(row.operatingProfitMargin),
        netProfitMargin: toNumber(row.netProfitMargin),
        // Returns
        returnOnAssets: toNumber(row.returnOnAssets),
        returnOnEquity: toNumber(row.returnOnEquity),
        returnOnCapitalEmployed: toNumber(row.returnOnCapitalEmployed),
        // Leverage ratios
        debtRatio: toNumber(row.debtRatio),
        debtEquityRatio: toNumber(row.debtEquityRatio),
        interestCoverage: toNumber(row.interestCoverage),
        // Asset turnover
        assetTurnover: toNumber(row.assetTurnover),
        inventoryTurnover: toNumber(row.inventoryTurnover),
        receivablesTurnover: toNumber(row.receivablesTurnover),
        // Cash flow ratios
        operatingCashFlowPerShare: toNumber(row.operatingCashFlowPerShare),
        freeCashFlowPerShare: toNumber(row.freeCashFlowPerShare),
        cashPerShare: toNumber(row.cashPerShare),
        // Valuation ratios
        priceEarningsRatio: toNumber(row.priceEarningsRatio),
        priceToBookRatio: toNumber(row.priceToBookRatio),
        priceToSalesRatio: toNumber(row.priceToSalesRatio),
        priceToFreeCashFlowsRatio: toNumber(row.priceToFreeCashFlowsRatio),
        dividendYield: toNumber(row.dividendYield),
        enterpriseValueMultiple: toNumber(row.enterpriseValueMultiple),
      }));

      return {
        symbol: symbol.toUpperCase(),
        period,
        rows,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch ratios: ${errorMessage}`);
    }
  },
});
