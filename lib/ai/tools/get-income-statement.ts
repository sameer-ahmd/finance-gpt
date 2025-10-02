import { tool } from "ai";
import { z } from "zod";

// Full income statement data structure
export type IncomeStatementRow = {
  date: string;
  symbol: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
};

// Data source interface
interface FinancialDataSource {
  fetchIncomeStatement(
    ticker: string,
    period: string
  ): Promise<IncomeStatementRow[]>;
}

// FMP implementation
class FMPDataSource implements FinancialDataSource {
  async fetchIncomeStatement(
    ticker: string,
    period: string
  ): Promise<IncomeStatementRow[]> {
    const url = `https://financialmodelingprep.com/api/v3/income-statement/${ticker}?period=${period}&limit=10&apikey=${process.env.FMP_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch financial data for ${ticker}. Please check the ticker symbol.`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error(`No financial data found for ticker ${ticker}.`);
    }

    // Return full income statement data, reversed to be chronological
    return data.map((row: any) => ({
      date: row.date,
      symbol: row.symbol,
      revenue: row.revenue || 0,
      costOfRevenue: row.costOfRevenue || 0,
      grossProfit: row.grossProfit || 0,
      grossProfitRatio: row.grossProfitRatio || 0,
      operatingIncome: row.operatingIncome || 0,
      operatingIncomeRatio: row.operatingIncomeRatio || 0,
      netIncome: row.netIncome || 0,
      netIncomeRatio: row.netIncomeRatio || 0,
      eps: row.eps || 0,
      epsdiluted: row.epsdiluted || 0,
    })).reverse();
  }
}

// Active data source
const dataSource: FinancialDataSource = new FMPDataSource();

// Helper function to format data as markdown table
function formatAsTable(data: IncomeStatementRow[], metric: string): string {
  const headers = "| Date | " + metric + " |";
  const separator = "|------|-------------|";

  const rows = data.map((row) => {
    let value: number;
    switch (metric) {
      case "revenue":
        value = row.revenue;
        break;
      case "netIncome":
        value = row.netIncome;
        break;
      case "grossProfit":
        value = row.grossProfit;
        break;
      default:
        value = 0;
    }
    return `| ${row.date} | ${value?.toLocaleString() ?? "N/A"} |`;
  });

  return [headers, separator, ...rows].join("\n");
}

export const getIncomeStatement = tool({
  description: "Fetch complete income statement data from Financial Modeling Prep for a stock ticker. Returns full financial data including revenue, costs, gross profit, operating income, and net income. This data can be used for KPI analysis like margin calculations, growth rates, etc.",
  inputSchema: z.object({
    ticker: z.string().describe("Stock ticker symbol (e.g., AAPL, MSFT)"),
    metric: z.enum(["revenue", "netIncome", "grossProfit"]).optional().default("revenue").describe("Primary metric to display in summary"),
    period: z.enum(["annual", "quarterly"]).optional().default("annual").describe("Time period for data"),
  }),
  execute: async ({ ticker, metric = "revenue", period = "annual" }) => {
    try {
      const fullData = await dataSource.fetchIncomeStatement(ticker, period);

      const table = formatAsTable(fullData, metric);

      // Return both formatted table and FULL income statement data for tool chaining
      return {
        content: `**${ticker} ${metric} (${period})**\n\n${table}`,
        fullData, // Complete income statement with all fields
        ticker,
        metric,
        period,
      };
    } catch (error) {
      return {
        content: `Error fetching financial data for ${ticker}: ${error instanceof Error ? error.message : "Unknown error"}`,
        fullData: [],
        ticker,
        metric,
        period,
      };
    }
  },
});
