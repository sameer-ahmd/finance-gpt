import { generateText, tool } from "ai";
import { z } from "zod";
import type { IncomeStatementRow } from "../get-income-statement";
import { myProvider } from "../../providers";

export const calculateKPITool = tool({
  description:
    "Calculate any financial KPI or metric (e.g., margins, ratios, growth rates, efficiency metrics) from complete income statement data. Use this for margin analysis, profitability metrics, and other calculations requiring full financial data.",
  inputSchema: z.object({
    fullData: z
      .array(
        z.object({
          date: z.string(),
          symbol: z.string().optional(),
          revenue: z.number(),
          costOfRevenue: z.number(),
          grossProfit: z.number(),
          grossProfitRatio: z.number(),
          operatingIncome: z.number(),
          operatingIncomeRatio: z.number(),
          netIncome: z.number(),
          netIncomeRatio: z.number(),
          eps: z.number().optional(),
          epsdiluted: z.number().optional(),
        })
      )
      .describe("Complete income statement data with all financial metrics"),
    kpi: z
      .string()
      .describe(
        "The KPI or metric to calculate (e.g., 'gross margin trend', 'operating margin', 'net profit margin', 'year-over-year revenue growth')"
      ),
    ticker: z.string().optional().describe("Stock ticker symbol"),
    period: z
      .string()
      .optional()
      .describe("Time period (annual or quarterly)"),
  }),
  execute: async ({ fullData, kpi, ticker, period }) => {
    if (!fullData || fullData.length === 0) {
      return "Error: No data provided for KPI calculation";
    }

    // Format the data for the LLM
    const formattedData = fullData
      .map(
        (row) =>
          `${row.date}:
  Revenue: $${row.revenue.toLocaleString()}
  Cost of Revenue: $${row.costOfRevenue.toLocaleString()}
  Gross Profit: $${row.grossProfit.toLocaleString()} (${(row.grossProfitRatio * 100).toFixed(1)}%)
  Operating Income: $${row.operatingIncome.toLocaleString()} (${(row.operatingIncomeRatio * 100).toFixed(1)}%)
  Net Income: $${row.netIncome.toLocaleString()} (${(row.netIncomeRatio * 100).toFixed(1)}%)`
      )
      .join("\n\n");

    // Use LLM to calculate the KPI
    const prompt = `You are a financial analyst. Calculate the following KPI from the complete income statement data provided and show your work.

KPI to Calculate: ${kpi}
${ticker ? `Ticker: ${ticker}` : ""}
${period ? `Period: ${period}` : ""}

Complete Income Statement Data (${fullData.length} periods):
${formattedData}

Instructions:
1. All data needed is provided above (revenue, costs, margins, net income, etc.)
2. Calculate the requested KPI with step-by-step calculations
3. Format your response as follows:
   - Start with a header: **${ticker || ""} ${kpi}**
   - Show the calculation methodology
   - Present results in a clear table format showing the KPI for each period
   - Include trend analysis and insights
   - Show formulas used

Format your response in markdown with clear sections and calculations shown.`;

    try {
      const { text } = await generateText({
        model: myProvider.languageModel("chat-model"),
        prompt,
        temperature: 0.1, // Low temperature for more consistent calculations
      });

      return text;
    } catch (error) {
      return `Error calculating KPI: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
});
