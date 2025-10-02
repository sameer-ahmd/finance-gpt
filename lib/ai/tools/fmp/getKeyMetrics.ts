import { tool } from 'ai';
import { z } from 'zod';
import { cachedFetch } from '@/lib/fmp/cached-fetch';

interface KeyMetricsRow {
  symbol?: string;
  date?: string;
  calendarYear?: string;
  period?: string;
  revenuePerShare?: number | string;
  netIncomePerShare?: number | string;
  operatingCashFlowPerShare?: number | string;
  freeCashFlowPerShare?: number | string;
  cashPerShare?: number | string;
  bookValuePerShare?: number | string;
  tangibleBookValuePerShare?: number | string;
  shareholdersEquityPerShare?: number | string;
  interestDebtPerShare?: number | string;
  marketCap?: number | string;
  enterpriseValue?: number | string;
  peRatio?: number | string;
  priceToSalesRatio?: number | string;
  pocfratio?: number | string;
  pfcfRatio?: number | string;
  pbRatio?: number | string;
  ptbRatio?: number | string;
  evToSales?: number | string;
  enterpriseValueOverEBITDA?: number | string;
  evToOperatingCashFlow?: number | string;
  evToFreeCashFlow?: number | string;
  earningsYield?: number | string;
  freeCashFlowYield?: number | string;
  debtToEquity?: number | string;
  debtToAssets?: number | string;
  netDebtToEBITDA?: number | string;
  currentRatio?: number | string;
  interestCoverage?: number | string;
  incomeQuality?: number | string;
  dividendYield?: number | string;
  payoutRatio?: number | string;
  salesGeneralAndAdministrativeToRevenue?: number | string;
  researchAndDdevelopementToRevenue?: number | string;
  intangiblesToTotalAssets?: number | string;
  capexToOperatingCashFlow?: number | string;
  capexToRevenue?: number | string;
  capexToDepreciation?: number | string;
  stockBasedCompensationToRevenue?: number | string;
  grahamNumber?: number | string;
  roic?: number | string;
  returnOnTangibleAssets?: number | string;
  grahamNetNet?: number | string;
  workingCapital?: number | string;
  tangibleAssetValue?: number | string;
  netCurrentAssetValue?: number | string;
  investedCapital?: number | string;
  averageReceivables?: number | string;
  averagePayables?: number | string;
  averageInventory?: number | string;
  daysSalesOutstanding?: number | string;
  daysPayablesOutstanding?: number | string;
  daysOfInventoryOnHand?: number | string;
  receivablesTurnover?: number | string;
  payablesTurnover?: number | string;
  inventoryTurnover?: number | string;
  roe?: number | string;
  capexPerShare?: number | string;
}

const toNumber = (val: any): number | undefined => {
  if (val === null || val === undefined || val === '') return undefined;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(num) ? undefined : num;
};

export const getKeyMetrics = tool({
  description: `Get key financial metrics and per-share values including market cap, enterprise value, valuation multiples, and efficiency metrics. Returns quarterly or annual data sorted from newest to oldest. Use this for quick financial overview and valuation analysis.`,
  inputSchema: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., "AAPL", "MSFT", "TSLA")'),
    period: z.enum(['annual', 'quarter']).optional().default('quarter').describe('Reporting period: "annual" for yearly data or "quarter" for quarterly data'),
    limit: z.number().optional().default(12).describe('Number of periods to return (default: 12)'),
  }),
  execute: async ({ symbol, period = 'quarter', limit = 12 }) => {
    try {
      const data = await cachedFetch<KeyMetricsRow[]>({
        path: `key-metrics/${symbol.toUpperCase()}`,
        params: { period, limit },
        ttl: 86400, // 24 hours
      });

      if (!data || data.length === 0) {
        throw new Error(`No key metrics data found for ${symbol}`);
      }

      // Normalize rows
      const rows = data.map(row => ({
        date: row.date || 'N/A',
        period: row.period || period,
        calendarYear: row.calendarYear || 'N/A',
        // Per-share metrics
        revenuePerShare: toNumber(row.revenuePerShare),
        netIncomePerShare: toNumber(row.netIncomePerShare),
        operatingCashFlowPerShare: toNumber(row.operatingCashFlowPerShare),
        freeCashFlowPerShare: toNumber(row.freeCashFlowPerShare),
        cashPerShare: toNumber(row.cashPerShare),
        bookValuePerShare: toNumber(row.bookValuePerShare),
        tangibleBookValuePerShare: toNumber(row.tangibleBookValuePerShare),
        // Market metrics
        marketCap: toNumber(row.marketCap),
        enterpriseValue: toNumber(row.enterpriseValue),
        // Valuation ratios
        peRatio: toNumber(row.peRatio),
        priceToSalesRatio: toNumber(row.priceToSalesRatio),
        pbRatio: toNumber(row.pbRatio) ?? toNumber(row.ptbRatio),
        pfcfRatio: toNumber(row.pfcfRatio),
        evToSales: toNumber(row.evToSales),
        enterpriseValueOverEBITDA: toNumber(row.enterpriseValueOverEBITDA),
        evToOperatingCashFlow: toNumber(row.evToOperatingCashFlow),
        evToFreeCashFlow: toNumber(row.evToFreeCashFlow),
        // Yields
        earningsYield: toNumber(row.earningsYield),
        freeCashFlowYield: toNumber(row.freeCashFlowYield),
        dividendYield: toNumber(row.dividendYield),
        // Leverage
        debtToEquity: toNumber(row.debtToEquity),
        debtToAssets: toNumber(row.debtToAssets),
        netDebtToEBITDA: toNumber(row.netDebtToEBITDA),
        currentRatio: toNumber(row.currentRatio),
        interestCoverage: toNumber(row.interestCoverage),
        // Efficiency
        roic: toNumber(row.roic),
        roe: toNumber(row.roe),
        returnOnTangibleAssets: toNumber(row.returnOnTangibleAssets),
        inventoryTurnover: toNumber(row.inventoryTurnover),
        receivablesTurnover: toNumber(row.receivablesTurnover),
        payablesTurnover: toNumber(row.payablesTurnover),
        // Capital allocation
        capexToOperatingCashFlow: toNumber(row.capexToOperatingCashFlow),
        capexToRevenue: toNumber(row.capexToRevenue),
        workingCapital: toNumber(row.workingCapital),
        investedCapital: toNumber(row.investedCapital),
      }));

      return {
        symbol: symbol.toUpperCase(),
        period,
        rows,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch key metrics: ${errorMessage}`);
    }
  },
});
