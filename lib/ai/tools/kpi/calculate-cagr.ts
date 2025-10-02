import { tool } from "ai";
import { z } from "zod";

type CAGRCalculation = {
  horizon: number;
  startDate: string;
  endDate: string;
  startValue: number;
  endValue: number;
  cagr: number;
  formula: string;
  available: boolean;
};

// Helper function to calculate CAGR with workings
function calculateCAGRWithWorkings(
  series: Array<{ date: string; value: number }>,
  horizons: number[]
): CAGRCalculation[] {
  return horizons.map((h) => {
    if (series.length < h + 1) {
      return {
        horizon: h,
        startDate: "",
        endDate: "",
        startValue: 0,
        endValue: 0,
        cagr: 0,
        formula: "",
        available: false,
      };
    }

    const startIndex = series.length - h - 1;
    const endIndex = series.length - 1;
    const start = series[startIndex]?.value;
    const end = series[endIndex]?.value;

    if (!start || !end || start <= 0) {
      return {
        horizon: h,
        startDate: series[startIndex]?.date || "",
        endDate: series[endIndex]?.date || "",
        startValue: start || 0,
        endValue: end || 0,
        cagr: 0,
        formula: "",
        available: false,
      };
    }

    const cagr = ((end / start) ** (1 / h) - 1) * 100;
    const formula = `((${end.toLocaleString()} / ${start.toLocaleString()}) ^ (1/${h})) - 1`;

    return {
      horizon: h,
      startDate: series[startIndex]?.date || "",
      endDate: series[endIndex]?.date || "",
      startValue: start,
      endValue: end,
      cagr,
      formula,
      available: true,
    };
  });
}

export const calculateCAGRTool = tool({
  description:
    "Calculate Compound Annual Growth Rate (CAGR) for a time series of financial data over specified time horizons. Shows detailed calculation steps.",
  inputSchema: z.object({
    series: z
      .array(
        z.object({
          date: z.string().describe("Date in YYYY-MM-DD format"),
          value: z.number().describe("Value at that date"),
        })
      )
      .describe("Time series data sorted chronologically"),
    horizons: z
      .array(z.number())
      .describe("Years for CAGR calculation (e.g., [3, 5, 10])"),
    metric: z.string().optional().describe("Name of the metric being analyzed"),
    ticker: z.string().optional().describe("Stock ticker symbol"),
  }),
  execute: async ({ series, horizons, metric, ticker }) => {
    if (!series || series.length === 0) {
      return "Error: No data provided for CAGR calculation";
    }

    if (!horizons || horizons.length === 0) {
      return "Error: No time horizons specified for CAGR calculation";
    }

    const calculations = calculateCAGRWithWorkings(series, horizons);

    // Build detailed output with workings
    let output = "";

    // Header
    const tickerLabel = ticker ? `${ticker} ` : "";
    const metricLabel = metric ? `${metric} ` : "";
    output += `**${tickerLabel}${metricLabel}CAGR Analysis**\n\n`;

    // Show each calculation with workings
    for (const calc of calculations) {
      if (!calc.available) {
        output += `### ${calc.horizon}-Year CAGR: N/A\n`;
        output += `*Insufficient data points*\n\n`;
        continue;
      }

      output += `### ${calc.horizon}-Year CAGR: ${calc.cagr.toFixed(1)}%\n\n`;
      output += `**Period:** ${calc.startDate} → ${calc.endDate}\n\n`;
      output += `**Calculation:**\n`;
      output += `- Starting Value: ${calc.startValue.toLocaleString()}\n`;
      output += `- Ending Value: ${calc.endValue.toLocaleString()}\n`;
      output += `- Formula: ${calc.formula}\n`;
      output += `- Result: ${calc.cagr.toFixed(2)}%\n\n`;
      output += `---\n\n`;
    }

    // Summary
    output += `*Based on ${series.length} data points from ${series[0]?.date} to ${series[series.length - 1]?.date}*`;

    return output;
  },
});
