import { tool } from 'ai';
import { z } from 'zod';
import { cachedFetch } from '@/lib/fmp/cached-fetch';

interface IncomeStatementRow {
  date?: string;
  symbol?: string;
  reportedCurrency?: string;
  cik?: string;
  fillingDate?: string;
  acceptedDate?: string;
  calendarYear?: string;
  period?: string;
  revenue?: number | string;
  costOfRevenue?: number | string;
  grossProfit?: number | string;
  grossProfitRatio?: number | string;
  researchAndDevelopmentExpenses?: number | string;
  generalAndAdministrativeExpenses?: number | string;
  sellingAndMarketingExpenses?: number | string;
  sellingGeneralAndAdministrativeExpenses?: number | string;
  otherExpenses?: number | string;
  operatingExpenses?: number | string;
  costAndExpenses?: number | string;
  interestIncome?: number | string;
  interestExpense?: number | string;
  depreciationAndAmortization?: number | string;
  ebitda?: number | string;
  ebitdaratio?: number | string;
  operatingIncome?: number | string;
  operatingIncomeRatio?: number | string;
  totalOtherIncomeExpensesNet?: number | string;
  incomeBeforeTax?: number | string;
  incomeBeforeTaxRatio?: number | string;
  incomeTaxExpense?: number | string;
  netIncome?: number | string;
  netIncomeRatio?: number | string;
  eps?: number | string;
  epsdiluted?: number | string;
  weightedAverageShsOut?: number | string;
  weightedAverageShsOutDil?: number | string;
  link?: string;
  finalLink?: string;
}

const toNumber = (val: any): number | undefined => {
  if (val === null || val === undefined || val === '') return undefined;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(num) ? undefined : num;
};

export const getIncomeStatement = tool({
  description: `Get income statement data showing revenue, expenses, and profitability metrics. Returns quarterly or annual data sorted from newest to oldest. Use this to analyze revenue growth, profit margins, and operating performance.`,
  inputSchema: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., "AAPL", "MSFT", "TSLA")'),
    period: z.enum(['annual', 'quarter']).optional().default('quarter').describe('Reporting period: "annual" for yearly data or "quarter" for quarterly data'),
    limit: z.number().optional().default(12).describe('Number of periods to return (default: 12)'),
  }),
  execute: async ({ symbol, period = 'quarter', limit = 12 }) => {
    try {
      const data = await cachedFetch<IncomeStatementRow[]>({
        path: `income-statement/${symbol.toUpperCase()}`,
        params: { period, limit },
        ttl: 86400, // 24 hours
      });

      if (!data || data.length === 0) {
        throw new Error(`No income statement data found for ${symbol}`);
      }

      // Normalize rows
      const rows = data.map(row => ({
        date: row.date || 'N/A',
        period: row.period || period,
        calendarYear: row.calendarYear || 'N/A',
        revenue: toNumber(row.revenue),
        costOfRevenue: toNumber(row.costOfRevenue),
        grossProfit: toNumber(row.grossProfit),
        grossProfitRatio: toNumber(row.grossProfitRatio),
        operatingExpenses: toNumber(row.operatingExpenses),
        operatingIncome: toNumber(row.operatingIncome),
        operatingIncomeRatio: toNumber(row.operatingIncomeRatio),
        researchAndDevelopmentExpenses: toNumber(row.researchAndDevelopmentExpenses),
        sellingGeneralAndAdministrativeExpenses: toNumber(row.sellingGeneralAndAdministrativeExpenses),
        interestExpense: toNumber(row.interestExpense),
        ebitda: toNumber(row.ebitda),
        ebitdaRatio: toNumber(row.ebitdaratio),
        incomeBeforeTax: toNumber(row.incomeBeforeTax),
        incomeTaxExpense: toNumber(row.incomeTaxExpense),
        netIncome: toNumber(row.netIncome),
        netIncomeRatio: toNumber(row.netIncomeRatio),
        eps: toNumber(row.eps),
        epsDiluted: toNumber(row.epsdiluted),
        weightedAverageShsOut: toNumber(row.weightedAverageShsOut),
        weightedAverageShsOutDiluted: toNumber(row.weightedAverageShsOutDil),
      }));

      return {
        symbol: symbol.toUpperCase(),
        period,
        rows,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch income statement: ${errorMessage}`);
    }
  },
});
