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

1. **Fetch live data** from Financial Modeling Prep API
2. **Calculate metrics** with step-by-step workings
3. **Visualize results** with interactive tables and charts
4. **Explain insights** in natural language

Built on a modular architecture with Redis caching, swappable data sources, and extensible financial tools.

> **Note:** This project is built on top of the [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) template, extending it with comprehensive financial analysis capabilities.

## Architecture

### System Overview

```
User Query
    ↓
AI Model (Tool Selection)
    ↓
FMP API Tools (12 endpoints) → Redis Cache → Financial Modeling Prep API
    ↓
UI Components (Tables, Metric Tiles, Charts)
    ↓
Formatted Response
```

#### 1. **Caching Layer** (`lib/fmp/cached-fetch.ts`)
- **Redis-backed caching** with 24-hour default TTL
- **Exponential backoff retry** (2 attempts, 429/5xx handling)
- **Performance logging** for monitoring API latency
- **Versioned cache keys** (`fmp:v1:...`) for easy invalidation

#### 2. **FMP API Tools** (`lib/ai/tools/fmp/`)

**12 Financial Data Tools:**
- `searchCompany` - Find companies by name/ticker
- `getCompanyProfile` - Business overview, sector, executives
- `getIncomeStatementFMP` - Revenue, margins, profitability
- `getBalanceSheet` - Assets, liabilities, equity
- `getCashFlow` - Operating/investing/financing activities
- `getRatios` - 30+ financial ratios (liquidity, profitability, leverage)
- `getKeyMetrics` - Per-share values, valuation multiples
- `getEnterpriseValues` - Historical EV calculations
- `getSharesOutstanding` - Dilution tracking
- `getEarningsCalendar` - Earnings dates with actual vs estimated
- `getFilings` - SEC filings (10-K, 10-Q, 8-K)
- `getDividends` - Historical dividend payments

**Key Features:**
- Zod validation with TypeScript inference
- Normalized JSON output (`rows` array, newest→oldest)
- Auto-computed metrics (totalDebt, freeCashFlow)
- Period support (annual/quarter)

#### 3. **KPI Calculation Tools** (`lib/ai/tools/kpi/`)
- `calculateCAGRTool` - Compound Annual Growth Rate with workings
- `calculateKPITool` - General-purpose LLM-based calculations
- `getIncomeStatement` - Legacy tool with swappable data sources

#### 4. **UI Components** (`components/`)
- **Table.tsx** - Auto-formatting tables with camelCase→Title Case
- **MetricTile.tsx** - KPI cards with currency/percent/number formatting
- **MiniChart.tsx** - SVG sparklines and area charts
- **Tool Display** - Collapsible tool cards with creative loading messages

### Tool Chaining Example

```
User: "What's Apple's P/E ratio and revenue growth?"
    ↓
AI selects: getKeyMetrics(AAPL) + getIncomeStatementFMP(AAPL)
    ↓
Tools execute in parallel (cached if available)
    ↓
UI renders: MetricTiles for P/E + Table for revenue trend
    ↓
AI synthesizes: "Apple's P/E is 28.5x. Revenue grew 8% YoY..."
```

### Performance Optimizations

1. **Parallel tool execution** - Multiple tools called simultaneously
2. **Redis caching** - Instant responses for repeated queries
3. **Tool streaming** - `experimental_toolCallStreaming: true`
4. **Active tool filtering** - Only relevant tools sent to LLM
5. **Reduced retry delays** - Faster failures (50ms base delay)

## Quick Start

### Prerequisites

- Node.js 18+
- [FMP API key](https://financialmodelingprep.com/developer/docs/) (free tier: 250 requests/day)
- Redis (optional, for caching)

### Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Environment variables** (`.env.local`)
   ```bash
   # Required
   FMP_API_KEY=your_fmp_api_key

   # Optional (for caching)
   REDIS_URL=redis://localhost:6379

   # Database & Auth (see Vercel AI Chatbot template)
   DATABASE_URL=...
   AUTH_SECRET=...
   ```

3. **Run migrations & start**
   ```bash
   pnpm db:migrate
   pnpm dev
   ```

### Test Queries

- "Search for Apple"
- "Show me TSLA's income statement"
- "What's Microsoft's P/E ratio?"
- "Get Amazon's cash flow for the last 4 quarters"
- "Compare Apple and Microsoft's gross profit margins"

### Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/finance-gpt)

Make sure to add all environment variables in your Vercel project settings.
