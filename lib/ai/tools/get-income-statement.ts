import { tool } from "ai";
import { z } from "zod";

export const getIncomeStatement = tool({
  description: "Fetch financial data from Financial Modeling Prep (FMP) and compute growth metrics for stocks",
  inputSchema: z.object({
    ticker: z.string().describe("Stock ticker symbol (e.g., AAPL, MSFT)"),
    metric: z.enum(["revenue", "netIncome", "freeCashFlow"]).describe("Financial metric to retrieve"),
    period: z.enum(["annual", "quarterly"]).optional().default("annual").describe("Time period for data"),
    horizons: z.array(z.number()).optional().describe("Years for CAGR calculation (e.g., [3, 5, 10])"),
  }),
  execute: async ({ ticker, metric, period, horizons = [] }) => {
    const url = `https://financialmodelingprep.com/api/v3/income-statement/${ticker}?period=${period}&limit=10&apikey=${process.env.FMP_API_KEY}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return `Failed to fetch financial data for ${ticker}. Please check the ticker symbol.`;
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        return `No financial data found for ticker ${ticker}.`;
      }

      const series = data.map((row: any) => ({
        date: row.date,
        value: row[metric],
      })).reverse();

      // Optional growth calculation
      const growthSummary = horizons.map(h => {
        if (series.length < h) return `${h}y: N/A`;
        const start = series[series.length - h - 1]?.value;
        const end = series[series.length - 1]?.value;
        if (!start || !end || start <= 0) return `${h}y: N/A`;
        const cagr = ((end / start) ** (1 / h) - 1) * 100;
        return `${h}y CAGR: ${cagr.toFixed(1)}%`;
      }).join(" • ");

      // Markdown table
      const table = [
        "| Date | " + metric + " |",
        "|------|-------------|",
        ...series.map((s: { date: string; value: number }) => `| ${s.date} | ${s.value?.toLocaleString() ?? "N/A"} |`)
      ].join("\n");

      return `**${ticker} ${metric} (${period})**\n\n${table}\n\n${growthSummary ? `\n${growthSummary}` : ""}`;
    } catch (error) {
      return `Error fetching financial data for ${ticker}: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
});
