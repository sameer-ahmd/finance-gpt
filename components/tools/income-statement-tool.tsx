import type { ChatMessage } from "@/lib/types";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../elements/tool";
import { FinancialData } from "../financial-data";

type IncomeStatementPart = Extract<
  ChatMessage["parts"][number],
  { type: "tool-getIncomeStatement" }
>;

export function IncomeStatementTool({ part }: { part: IncomeStatementPart }) {
  const { toolCallId, state } = part;

  return (
    <Tool defaultOpen={false} key={toolCallId}>
      <ToolHeader state={state} type="tool-getIncomeStatement" />
      <ToolContent>
        {state === "input-available" && <ToolInput input={part.input} />}
        {state === "output-available" && (
          <ToolOutput
            errorText={part.errorText}
            output={<FinancialData financialData={part.output} />}
          />
        )}
      </ToolContent>
    </Tool>
  );
}
