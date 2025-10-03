import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";
import type { calculateCAGRTool } from "./ai/tools/kpi/calculate-cagr";
import type { calculateKPITool } from "./ai/tools/kpi/calculate-kpi";
import type { getEarningsTranscript } from "./ai/tools/get-earnings-transcript";
import type { getIncomeStatement } from "./ai/tools/get-income-statement";
import type {
  searchCompany,
  getCompanyProfile,
  getIncomeStatement as getIncomeStatementFMP,
  getBalanceSheet,
  getCashFlow,
  getRatios,
  getKeyMetrics,
  getEnterpriseValues,
  getSharesOutstanding,
  getEarningsCalendar,
  getFilings,
  getDividends,
} from "./ai/tools/fmp";
import type { Suggestion } from "./db/schema";
import type { AppUsage } from "./usage";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type incomeStatementTool = InferUITool<typeof getIncomeStatement>;
type earningsTranscriptTool = InferUITool<typeof getEarningsTranscript>;
type calculateCAGRToolType = InferUITool<typeof calculateCAGRTool>;
type calculateKPIToolType = InferUITool<typeof calculateKPITool>;

// FMP API Tools
type searchCompanyTool = InferUITool<typeof searchCompany>;
type getCompanyProfileTool = InferUITool<typeof getCompanyProfile>;
type getIncomeStatementFMPTool = InferUITool<typeof getIncomeStatementFMP>;
type getBalanceSheetTool = InferUITool<typeof getBalanceSheet>;
type getCashFlowTool = InferUITool<typeof getCashFlow>;
type getRatiosTool = InferUITool<typeof getRatios>;
type getKeyMetricsTool = InferUITool<typeof getKeyMetrics>;
type getEnterpriseValuesTool = InferUITool<typeof getEnterpriseValues>;
type getSharesOutstandingTool = InferUITool<typeof getSharesOutstanding>;
type getEarningsCalendarTool = InferUITool<typeof getEarningsCalendar>;
type getFilingsTool = InferUITool<typeof getFilings>;
type getDividendsTool = InferUITool<typeof getDividends>;

export type ChatTools = {
  getIncomeStatement: incomeStatementTool;
  getEarningsTranscript: earningsTranscriptTool;
  calculateCAGRTool: calculateCAGRToolType;
  calculateKPITool: calculateKPIToolType;
  searchCompany: searchCompanyTool;
  getCompanyProfile: getCompanyProfileTool;
  getIncomeStatementFMP: getIncomeStatementFMPTool;
  getBalanceSheet: getBalanceSheetTool;
  getCashFlow: getCashFlowTool;
  getRatios: getRatiosTool;
  getKeyMetrics: getKeyMetricsTool;
  getEnterpriseValues: getEnterpriseValuesTool;
  getSharesOutstanding: getSharesOutstandingTool;
  getEarningsCalendar: getEarningsCalendarTool;
  getFilings: getFilingsTool;
  getDividends: getDividendsTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  usage: AppUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};
