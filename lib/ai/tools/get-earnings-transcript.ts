import { tool } from "ai";
import { z } from "zod";

// API Response types
interface TranscriptResponse {
  symbol: string;
  quarter: number;
  year: number;
  date: string;
  content: string;
}

// Data source interface
interface EarningsTranscriptDataSource {
  fetchTranscript(
    ticker: string,
    year: number,
    quarter: number
  ): Promise<string>;
}

// FMP implementation
class FMPTranscriptDataSource implements EarningsTranscriptDataSource {
  private readonly baseUrl = "https://financialmodelingprep.com/api/v3";
  private readonly apiKey: string;

  constructor() {
    const key = process.env.FMP_API_KEY;
    if (!key) {
      throw new Error("FMP_API_KEY environment variable is not set");
    }
    this.apiKey = key;
  }

  async fetchTranscript(
    ticker: string,
    year: number,
    quarter: number
  ): Promise<string> {
    const url = `${this.baseUrl}/earning_call_transcript/${ticker}?year=${year}&quarter=${quarter}&apikey=${this.apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch earnings transcript for ${ticker} (Q${quarter} ${year}). Status: ${response.status}`
      );
    }

    const data = await response.json();

    if (!data || (Array.isArray(data) && data.length === 0)) {
      throw new Error(
        `No earnings transcript found for ${ticker} for Q${quarter} ${year}`
      );
    }

    // Handle array response
    if (Array.isArray(data)) {
      const transcript = data[0] as TranscriptResponse | undefined;
      if (!transcript || typeof transcript.content !== "string") {
        throw new Error(`Invalid transcript data for ${ticker}`);
      }
      return transcript.content;
    }

    // Handle single object response
    const transcript = data as TranscriptResponse;
    if (!transcript || typeof transcript.content !== "string") {
      throw new Error(`Invalid transcript data for ${ticker}`);
    }

    return transcript.content;
  }
}

// Active data source
const dataSource: EarningsTranscriptDataSource = new FMPTranscriptDataSource();

// Helper function to infer the most recent completed quarter
function inferRecentQuarter(): { year: number; quarter: number } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Calculate current quarter (1-4)
  const currentQuarter = Math.ceil(currentMonth / 3);

  // Earnings are typically reported 4-6 weeks after quarter end
  // So if we're in the first ~6 weeks of a quarter, the most recent
  // *available* transcript is likely from 2 quarters ago
  const dayOfMonth = now.getDate();
  const isEarlyInQuarter = currentMonth % 3 === 1 && dayOfMonth < 15;

  let inferredQuarter = currentQuarter - 1;
  let inferredYear = currentYear;

  // If we're early in the quarter, go back one more quarter
  if (isEarlyInQuarter) {
    inferredQuarter -= 1;
  }

  // Handle year rollover
  if (inferredQuarter < 1) {
    inferredQuarter += 4;
    inferredYear -= 1;
  }

  return { year: inferredYear, quarter: inferredQuarter };
}

// Helper function to format transcript with metadata
function formatTranscript(
  ticker: string,
  transcript: string,
  year: number,
  quarter: number
): string {
  const header = `**${ticker} Earnings Call Transcript - Q${quarter} ${year}**`;

  // Truncate very long transcripts for better UX
  const maxLength = 15000;
  const content = transcript.length > maxLength
    ? transcript.substring(0, maxLength) + "\n\n... [Transcript truncated due to length]"
    : transcript;

  return `${header}\n\n${content}`;
}

export const getEarningsTranscript = tool({
  description: `Fetch earnings call transcript(s) for a publicly traded company.

USAGE PATTERNS:
- Single transcript: Specify ticker, year, and quarter (e.g., AAPL Q3 2024)
- Latest transcript: Omit year/quarter and the tool infers the most recent quarter
- Multiple transcripts: Set numQuarters to 2-4 to fetch several recent quarters

IMPORTANT RULES:
- If user asks about "last few earnings calls", "recent quarters", "over the past year", etc., set numQuarters=3 or 4
- If user asks about a specific topic across calls, use numQuarters to get multiple transcripts in ONE tool call
- Default numQuarters=1 for single transcript requests
- Only call this tool ONCE per request, even for multiple quarters`,
  inputSchema: z.object({
    ticker: z.string().describe("Stock ticker symbol (e.g., AAPL, MSFT, SPOT)"),
    year: z.number().optional().describe("Year of the earnings call (e.g., 2024). If omitted for 'latest' requests, will infer based on current date."),
    quarter: z.number().min(1).max(4).optional().describe("Quarter number (1, 2, 3, or 4). If omitted for 'latest' requests, will infer the most recently completed quarter."),
    numQuarters: z.number().min(1).max(4).optional().default(1).describe("Number of consecutive quarters to fetch (1-4). Use 3-4 when user asks about 'last few', 'recent', or 'over the past year'. Defaults to 1."),
  }),
  execute: async ({ ticker, year, quarter, numQuarters = 1 }) => {
    try {
      // If year or quarter not provided, infer the most recent completed quarter
      let startYear = year;
      let startQuarter = quarter;

      if (startYear === undefined || startQuarter === undefined) {
        const inferred = inferRecentQuarter();
        startYear = startYear ?? inferred.year;
        startQuarter = startQuarter ?? inferred.quarter;
      }

      // Fetch multiple quarters if requested
      const transcripts: Array<{ year: number; quarter: number; content: string }> = [];

      let currentYear = startYear;
      let currentQuarter = startQuarter;

      for (let i = 0; i < numQuarters; i++) {
        try {
          const transcript = await dataSource.fetchTranscript(
            ticker.toUpperCase(),
            currentYear,
            currentQuarter
          );

          transcripts.push({
            year: currentYear,
            quarter: currentQuarter,
            content: transcript,
          });
        } catch (error) {
          // If we can't fetch a quarter, note it but continue with others
          transcripts.push({
            year: currentYear,
            quarter: currentQuarter,
            content: `[Transcript not available for Q${currentQuarter} ${currentYear}]`,
          });
        }

        // Move to previous quarter
        currentQuarter--;
        if (currentQuarter < 1) {
          currentQuarter = 4;
          currentYear--;
        }
      }

      // Format output
      if (numQuarters === 1) {
        return formatTranscript(
          ticker.toUpperCase(),
          transcripts[0]!.content,
          transcripts[0]!.year,
          transcripts[0]!.quarter
        );
      } else {
        // Format multiple transcripts
        const formatted = transcripts.map(t => {
          const header = `**${ticker.toUpperCase()} Earnings Call Transcript - Q${t.quarter} ${t.year}**`;
          const maxLength = 8000; // Shorter for multiple transcripts
          const content = t.content.length > maxLength
            ? t.content.substring(0, maxLength) + "\n\n... [Transcript truncated]"
            : t.content;
          return `${header}\n\n${content}`;
        }).join("\n\n---\n\n");

        return formatted;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return `Error fetching earnings transcript for ${ticker}: ${errorMessage}`;
    }
  },
});
