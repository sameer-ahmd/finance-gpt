import { tool } from 'ai';
import { z } from 'zod';
import { cachedFetch } from '@/lib/fmp/cached-fetch';

interface CashFlowRow {
  date?: string;
  symbol?: string;
  reportedCurrency?: string;
  cik?: string;
  fillingDate?: string;
  acceptedDate?: string;
  calendarYear?: string;
  period?: string;
  netIncome?: number | string;
  depreciationAndAmortization?: number | string;
  deferredIncomeTax?: number | string;
  stockBasedCompensation?: number | string;
  changeInWorkingCapital?: number | string;
  accountsReceivables?: number | string;
  inventory?: number | string;
  accountsPayables?: number | string;
  otherWorkingCapital?: number | string;
  otherNonCashItems?: number | string;
  netCashProvidedByOperatingActivities?: number | string;
  investmentsInPropertyPlantAndEquipment?: number | string;
  acquisitionsNet?: number | string;
  purchasesOfInvestments?: number | string;
  salesMaturitiesOfInvestments?: number | string;
  otherInvestingActivites?: number | string;
  netCashUsedForInvestingActivites?: number | string;
  debtRepayment?: number | string;
  commonStockIssued?: number | string;
  commonStockRepurchased?: number | string;
  dividendsPaid?: number | string;
  otherFinancingActivites?: number | string;
  netCashUsedProvidedByFinancingActivities?: number | string;
  effectOfForexChangesOnCash?: number | string;
  netChangeInCash?: number | string;
  cashAtEndOfPeriod?: number | string;
  cashAtBeginningOfPeriod?: number | string;
  operatingCashFlow?: number | string;
  capitalExpenditure?: number | string;
  freeCashFlow?: number | string;
  link?: string;
  finalLink?: string;
}

const toNumber = (val: any): number | undefined => {
  if (val === null || val === undefined || val === '') return undefined;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(num) ? undefined : num;
};

export const getCashFlow = tool({
  description: `Get cash flow statement data showing operating, investing, and financing activities. Returns quarterly or annual data sorted from newest to oldest. Use this to analyze cash generation, capital spending, and free cash flow.`,
  inputSchema: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., "AAPL", "MSFT", "TSLA")'),
    period: z.enum(['annual', 'quarter']).optional().default('quarter').describe('Reporting period: "annual" for yearly data or "quarter" for quarterly data'),
    limit: z.number().optional().default(12).describe('Number of periods to return (default: 12)'),
  }),
  execute: async ({ symbol, period = 'quarter', limit = 12 }) => {
    try {
      const data = await cachedFetch<CashFlowRow[]>({
        path: `cash-flow-statement/${symbol.toUpperCase()}`,
        params: { period, limit },
        ttl: 86400, // 24 hours
      });

      if (!data || data.length === 0) {
        throw new Error(`No cash flow data found for ${symbol}`);
      }

      // Normalize rows and compute freeCashFlow if missing
      const rows = data.map(row => {
        const operatingCashFlow = toNumber(row.operatingCashFlow) ?? toNumber(row.netCashProvidedByOperatingActivities);
        const capitalExpenditure = toNumber(row.capitalExpenditure) ?? toNumber(row.investmentsInPropertyPlantAndEquipment);
        const freeCashFlow = toNumber(row.freeCashFlow) ??
          ((operatingCashFlow !== undefined && capitalExpenditure !== undefined)
            ? operatingCashFlow + capitalExpenditure // capex is usually negative
            : undefined);

        return {
          date: row.date || 'N/A',
          period: row.period || period,
          calendarYear: row.calendarYear || 'N/A',
          netIncome: toNumber(row.netIncome),
          depreciationAndAmortization: toNumber(row.depreciationAndAmortization),
          stockBasedCompensation: toNumber(row.stockBasedCompensation),
          changeInWorkingCapital: toNumber(row.changeInWorkingCapital),
          accountsReceivables: toNumber(row.accountsReceivables),
          inventory: toNumber(row.inventory),
          accountsPayables: toNumber(row.accountsPayables),
          operatingCashFlow,
          investmentsInPropertyPlantAndEquipment: toNumber(row.investmentsInPropertyPlantAndEquipment),
          capitalExpenditure,
          acquisitionsNet: toNumber(row.acquisitionsNet),
          purchasesOfInvestments: toNumber(row.purchasesOfInvestments),
          salesMaturitiesOfInvestments: toNumber(row.salesMaturitiesOfInvestments),
          netCashUsedForInvestingActivities: toNumber(row.netCashUsedForInvestingActivites),
          debtRepayment: toNumber(row.debtRepayment),
          commonStockIssued: toNumber(row.commonStockIssued),
          commonStockRepurchased: toNumber(row.commonStockRepurchased),
          dividendsPaid: toNumber(row.dividendsPaid),
          netCashUsedProvidedByFinancingActivities: toNumber(row.netCashUsedProvidedByFinancingActivities),
          netChangeInCash: toNumber(row.netChangeInCash),
          cashAtEndOfPeriod: toNumber(row.cashAtEndOfPeriod),
          cashAtBeginningOfPeriod: toNumber(row.cashAtBeginningOfPeriod),
          freeCashFlow,
        };
      });

      return {
        symbol: symbol.toUpperCase(),
        period,
        rows,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch cash flow statement: ${errorMessage}`);
    }
  },
});
