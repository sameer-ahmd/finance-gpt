import { tool } from "ai";
import { z } from "zod";

// Data source interface
interface FinancialDataSource {
  fetchIncomeStatement(
    ticker: string,
    metric: string,
    period: string
  ): Promise<Array<{ date: string; value: number }>>;
}

// FMP implementation
class FMPDataSource implements FinancialDataSource {
  async fetchIncomeStatement(
    ticker: string,
    metric: string,
    period: string
  ): Promise<Array<{ date: string; value: number }>> {
    const url = `https://financialmodelingprep.com/api/v3/income-statement/${ticker}?period=${period}&limit=10&apikey=${process.env.FMP_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch financial data for ${ticker}. Please check the ticker symbol.`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error(`No financial data found for ticker ${ticker}.`);
    }

    return data.map((row: any) => ({
      date: row.date,
      value: row[metric],
    })).reverse();
  }
}

// Active data source
const dataSource: FinancialDataSource = new FMPDataSource();

// Helper function to format data as markdown table
function formatAsTable(series: Array<{ date: string; value: number }>, metric: string): string {
  return [
    "| Date | " + metric + " |",
    "|------|-------------|",
    ...series.map((s) => `| ${s.date} | ${s.value?.toLocaleString() ?? "N/A"} |`)
  ].join("\n");
}

export const getIncomeStatement = tool({
  description: "Fetch financial data (revenue, net income, free cash flow) from Financial Modeling Prep for a stock ticker. Returns time series data that can be used for further analysis like CAGR calculations.",
  inputSchema: z.object({
    ticker: z.string().describe("Stock ticker symbol (e.g., AAPL, MSFT)"),
    metric: z.enum(["revenue", "netIncome", "freeCashFlow"]).describe("Financial metric to retrieve"),
    period: z.enum(["annual", "quarterly"]).optional().default("annual").describe("Time period for data"),
  }),
  execute: async ({ ticker, metric, period }) => {
    try {
      const series = await dataSource.fetchIncomeStatement(ticker, metric, period);

      const table = formatAsTable(series, metric);

      // Return both formatted table and raw series data for potential tool chaining
      return {
        content: `**${ticker} ${metric} (${period})**\n\n${table}`,
        data: series,
        ticker,
        metric,
        period,
      };
    } catch (error) {
      return {
        content: `Error fetching financial data for ${ticker}: ${error instanceof Error ? error.message : "Unknown error"}`,
        data: [],
        ticker,
        metric,
        period,
      };
    }
  },
});
