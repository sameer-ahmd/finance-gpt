<h1 align="center">Finance GPT</h1>

<p align="center">
    An AI-powered financial analysis chatbot built with Next.js, the AI SDK, and real-time financial data.
</p>

<p align="center">
  Ask questions about company financials, get KPI calculations with detailed workings, and analyze trends—all through natural language.
</p>

<br/>

## Overview

Finance GPT is a conversational AI assistant that fetches real-time financial data and performs sophisticated analysis using tool chaining. Ask about revenue trends, profit margins, growth rates, or any financial metric, and the AI will:

1. **Fetch live data** from Financial Modeling Prep
2. **Calculate metrics** with step-by-step workings
3. **Visualize results** with interactive charts
4. **Explain insights** in natural language

Built on a modular architecture with swappable data sources and extensible KPI tools.

> **Note:** This project is built on top of the [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) template, extending it with financial analysis capabilities, tool chaining, and real-time data integration.

## Financial Tools Architecture

This application implements a sophisticated financial analysis system using tool chaining and swappable data sources.

### Data Fetching Layer

**`getIncomeStatement`** (`lib/ai/tools/get-income-statement.ts`)
- Fetches complete income statement data from Financial Modeling Prep API
- Returns full financial data structure including:
  - Revenue, Cost of Revenue, Gross Profit
  - Operating Income, Net Income
  - All associated ratios (margins, EPS)
- Supports swappable data sources via `FinancialDataSource` interface
- Returns structured data optimized for tool chaining

**Architecture Pattern:**
```typescript
interface FinancialDataSource {
  fetchIncomeStatement(ticker: string, period: string): Promise<IncomeStatementRow[]>;
}

class FMPDataSource implements FinancialDataSource {
  // FMP API implementation
}

const dataSource: FinancialDataSource = new FMPDataSource();
```

This pattern allows easy switching between data providers (FMP, Yahoo Finance, Alpha Vantage, etc.) by implementing the `FinancialDataSource` interface.

### KPI Calculation Layer

**`calculateCAGRTool`** (`lib/ai/tools/kpi/calculate-cagr.ts`)
- Specialized tool for Compound Annual Growth Rate calculations
- Shows detailed calculation workings:
  - Period analyzed (start date → end date)
  - Starting and ending values
  - Mathematical formula used
  - Final CAGR percentage
- Supports multiple time horizons (3Y, 5Y, 10Y)

**`calculateKPITool`** (`lib/ai/tools/kpi/calculate-kpi.ts`)
- General-purpose KPI calculator using LLM
- Handles any financial metric not covered by specialized tools:
  - Margin analysis (gross, operating, net)
  - Profitability ratios (ROE, ROIC, ROA)
  - Efficiency metrics (asset turnover, inventory turnover)
  - Year-over-year growth rates
- Receives complete income statement data
- LLM generates step-by-step calculations with methodology

### Tool Chaining Workflow

```
User Query: "What's Apple's gross margin trend over 5 years?"
    ↓
AI calls getIncomeStatement(ticker: "AAPL")
    ↓
Returns complete income statement with:
  - Revenue: $391B (2024), $383B (2023)...
  - Cost of Revenue: $210B (2024)...
  - Gross Profit: $181B (2024)...
    ↓
AI calls calculateKPITool(fullData: [...], kpi: "gross margin trend")
    ↓
LLM receives all financial data and calculates:
  - 2024: 46.2% margin
  - 2023: 44.1% margin
  - Trend analysis: +2.1% improvement
    ↓
User sees both tools' outputs with detailed workings
```

### UI Layer

**Income Statement Display** (`components/financial-data.tsx`)
- Visualizes financial data with interactive charts
- Supports both legacy string format and new structured data
- Displays key metrics with trend indicators
- Renders time series data chronologically

**Tool Output Display** (`components/message.tsx`, `components/elements/tool.tsx`)
- Collapsible tool cards showing:
  - Tool name and status (Pending/Running/Completed/Error)
  - Input parameters
  - Calculation results with workings
- Markdown rendering for formatted financial analysis

### System Prompt Design

The AI is instructed to proactively use financial tools via `financialToolsPrompt`:
- When to fetch income statement data
- When to use CAGR vs general KPI tools
- How to chain tools together
- Examples of proper tool usage

This ensures the AI autonomously:
1. Identifies financial questions
2. Fetches required data
3. Performs calculations with detailed workings
4. Presents insights to users

### Extensibility

**Adding new data sources:**
```typescript
class YahooFinanceDataSource implements FinancialDataSource {
  async fetchIncomeStatement(ticker: string, period: string) {
    // Implement Yahoo Finance API calls
  }
}

// Swap data source
const dataSource = new YahooFinanceDataSource();
```

**Adding new KPI tools:**
Create specialized tools (like `calculateCAGRTool`) for frequently requested metrics to provide deterministic, fast calculations without LLM overhead.

## Setup

### Prerequisites

- Node.js 18+
- [Financial Modeling Prep API key](https://financialmodelingprep.com/developer/docs/) (free tier available)
- Vercel account (for AI Gateway and deployment)

### Local Development

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo-url>
   cd finance-gpt
   npm install
   ```

2. **Set up environment variables**

   Create a `.env.local` file with the following:
   ```bash
   # Financial Modeling Prep API Key
   FMP_API_KEY=your_fmp_api_key_here

   # Database (Neon Postgres)
   DATABASE_URL=your_postgres_connection_string

   # Auth
   AUTH_SECRET=your_auth_secret

   # Storage (Vercel KV for chat history)
   KV_URL=your_kv_url
   KV_REST_API_TOKEN=your_kv_token
   ```

   > **Note:** Don't commit your `.env.local` file. Add it to `.gitignore`.

3. **Run migrations**
   ```bash
   npm run db:migrate
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be running at [localhost:3000](http://localhost:3000).

### Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/finance-gpt)

Make sure to add all environment variables in your Vercel project settings.
