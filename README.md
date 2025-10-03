<h1 align="center">Finance GPT</h1>

<p align="center">
    An AI-powered financial analysis chatbot built with Next.js, the AI SDK, and real-time financial data.
</p>

<p align="center">
  Ask questions about company financials, get KPI calculations with detailed workings, and analyze trends—all through natural language.
</p>

<br/>

## Overview

Finance GPT is a conversational AI assistant that fetches real-time financial data and performs sophisticated analysis. Ask about revenue trends, profit margins, growth rates, or any financial metric, and the AI will:

1. **Fetch live data** from Financial Modeling Prep API
2. **Calculate metrics** using specialized tools
3. **Visualize results** with formatted tables and metric tiles
4. **Explain insights** in natural language

Built on a modular architecture with Redis caching and extensible financial tools.

> **Note:** This project is built on top of the [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) template, extending it with comprehensive financial analysis capabilities.

## Architecture

### System Overview

```
User Query
    ↓
AI Model (Tool Selection - max 3 tool rounds)
    ↓
FMP API Tools (12 endpoints) → Redis Cache (optional) → Financial Modeling Prep API
    ↓
UI Tool Components (Collapsible cards with inputs/outputs)
    ↓
Formatted Response
```

#### 1. **Caching Layer** (`lib/fmp/cached-fetch.ts`)
- **Redis-backed caching** with 24-hour default TTL (optional, falls back to direct API calls)
- **Exponential backoff retry** (3 attempts max, handles 429/5xx errors)
- **Retry delay:** `2^attempt * 100ms + random(0-100ms)` jitter
- **Versioned cache keys** (`fmp:v1:...`) for easy invalidation

#### 2. **FMP API Tools** (`lib/ai/tools/fmp/`)

**12 Financial Data Tools:**
- `searchCompany` - Find companies by name/ticker
- `getCompanyProfile` - Business overview, sector, executives, market cap
- `getIncomeStatement` - Revenue, margins, profitability (annual/quarterly)
- `getBalanceSheet` - Assets, liabilities, equity
- `getCashFlow` - Operating/investing/financing activities
- `getRatios` - 30+ financial ratios (liquidity, profitability, leverage)
- `getKeyMetrics` - Per-share values, valuation multiples
- `getEnterpriseValues` - Historical EV calculations
- `getSharesOutstanding` - Historical shares and float data
- `getEarningsCalendar` - Earnings dates with actual vs estimated
- `getFilings` - SEC filings (10-K, 10-Q, 8-K)
- `getDividends` - Historical dividend payments

**Key Features:**
- Zod schema validation with TypeScript type inference
- Normalized JSON output (`rows` array)
- Period support (annual/quarterly) with configurable limits
- Computed fields (e.g., `totalDebt`, `freeCashFlow`)

#### 3. **Additional Tools** (`lib/ai/tools/`)
- `calculateCAGRTool` - Compound Annual Growth Rate with step-by-step workings
- `calculateKPITool` - General-purpose LLM-based KPI calculations
- `getEarningsTranscript` - Full earnings call transcript text
- `getIncomeStatement` - Legacy income statement tool

#### 4. **UI Components** (`components/`)

**Core Display Components:**
- `Table.tsx` - Auto-formatting tables with:
  - camelCase → Title Case header conversion
  - Number formatting with commas and decimals
  - Row limiting with "Showing X of Y" indicator

- `MetricTile.tsx` - KPI cards with:
  - Smart formatting (K/M/B suffixes for large numbers)
  - Currency, percent, and number formats
  - Optional trend indicators (↑/↓)

- `MiniChart.tsx` - SVG sparklines and area charts

**Tool UI Components** (`components/tools/`):
All 16 tools have dedicated components showing:
- Tool execution state (pending/running/completed/error)
- Input parameters in formatted JSON
- Output rendered with appropriate visualization

**Loading States:**
- `LoadingMessage` - Shows typing animation (3 bouncing dots) when AI is thinking
- Tool cards show "Running" state with animated indicator

#### 5. **AI Configuration**

**Model:** Configurable via `myProvider.languageModel()` (supports Claude, GPT-4, etc.)

**Performance Settings:**
- `stopWhen: stepCountIs(3)` - Maximum 3 tool execution rounds
- `smoothStream({ chunking: "word" })` - Word-by-word streaming
- System prompt limits tools to 2-3 per response

**System Prompt Strategy:**
- Concise financial domain focus (reduced from 160+ lines to ~50 lines)
- Explicit tool usage limits to reduce latency
- All tool fields documented in prompt for accurate tool selection

### Tool Chaining Example

```
User: "What's Apple's P/E ratio and revenue growth?"
    ↓
AI selects: getKeyMetrics(AAPL) + getIncomeStatement(AAPL)
    ↓
Tools execute sequentially (max 3 rounds)
    ↓
Cache check → Redis/API → Response
    ↓
UI renders: MetricTiles for P/E + Table for revenue
    ↓
AI synthesizes: "Apple's P/E is 28.5x. Revenue grew 8% YoY..."
```

### Performance Optimizations

1. **Redis caching** - 24-hour TTL for instant repeated queries (optional)
2. **Exponential backoff retry** - Handles rate limits gracefully
3. **Tool round limiting** - Max 3 rounds via `stopWhen: stepCountIs(3)`
4. **Optimized system prompt** - Reduced token overhead by 50%
5. **Component-based tool rendering** - Modular UI components in `/components/tools/`

## Quick Start

### Prerequisites

- Node.js 18+
- [FMP API key](https://financialmodelingprep.com/developer/docs/) (free tier: 250 requests/day)
- Redis (optional, for caching - will work without it)
- PostgreSQL database (for chat history)

### Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Environment variables** (`.env.local`)
   ```bash
   # Required
   FMP_API_KEY=your_fmp_api_key

   # Optional (caching - app works without Redis)
   REDIS_URL=redis://localhost:6379

   # Database (required for chat persistence)
   DATABASE_URL=postgresql://...

   # Auth (required)
   AUTH_SECRET=your_secret_here
   ```

3. **Run migrations & start**
   ```bash
   pnpm db:migrate
   pnpm dev
   ```

### Test Queries

- "Search for Apple"
- "Show me TSLA's income statement for the last 4 quarters"
- "What's Microsoft's P/E ratio?"
- "Get Amazon's cash flow"
- "Compare Apple and Microsoft's gross profit margins"
- "Calculate CAGR for Tesla revenue from 2020 to 2023"

### Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/finance-gpt)

**Required Environment Variables:**
- `FMP_API_KEY` (required)
- `DATABASE_URL` (required)
- `AUTH_SECRET` (required)
- `REDIS_URL` (optional - recommended for production)

## Project Structure

```
├── app/(chat)/api/chat/
│   └── route.ts              # Main chat API with tool registration
├── lib/
│   ├── ai/
│   │   ├── tools/
│   │   │   ├── fmp/          # 12 FMP API tools
│   │   │   ├── kpi/          # CAGR and KPI calculators
│   │   │   ├── get-earnings-transcript.ts
│   │   │   └── get-income-statement.ts
│   │   ├── prompts.ts        # System prompts
│   │   └── providers.ts      # AI model configuration
│   └── fmp/
│       └── cached-fetch.ts   # Redis caching + retry logic
├── components/
│   ├── tools/                # 16 tool UI components
│   ├── Table.tsx             # Data table with formatting
│   ├── MetricTile.tsx        # KPI card display
│   ├── MiniChart.tsx         # Sparkline charts
│   └── typing-animation.tsx  # Loading indicator
└── tests/                    # Test coverage documentation
```

## Technical Details

**Tech Stack:**
- **Framework:** Next.js 15
- **AI SDK:** Vercel AI SDK 4.1
- **Database:** PostgreSQL with Drizzle ORM
- **Caching:** Redis (ioredis)
- **Auth:** NextAuth
- **UI:** React 19, Tailwind CSS, Framer Motion
- **Validation:** Zod

**Key Features:**
- Tool call streaming with real-time UI updates
- Modular tool architecture for easy extensibility
- Type-safe API responses with Zod schemas
- Graceful degradation (works without Redis)
- Responsive design with mobile support
- Tool execution state visualization
