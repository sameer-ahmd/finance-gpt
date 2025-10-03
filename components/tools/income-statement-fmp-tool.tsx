import type { ChatMessage } from "@/lib/types";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../elements/tool";
import { Table } from "../Table";

type IncomeStatementFMPPart = Extract<
  ChatMessage["parts"][number],
  { type: "tool-getIncomeStatementFMP" }
>;

export function IncomeStatementFMPTool({ part }: { part: IncomeStatementFMPPart }) {
  const { toolCallId, state } = part;

  return (
    <Tool defaultOpen={false} key={toolCallId}>
      <ToolHeader state={state} type="tool-getIncomeStatementFMP" />
      <ToolContent>
        {state === "input-available" && <ToolInput input={part.input} />}
        {state === "output-available" && (
          <ToolOutput
            errorText={part.errorText}
            output={
              <Table
                data={part.output.rows || []}
                caption={`${part.output.symbol} Income Statement (${part.output.period})`}
                maxRows={8}
              />
            }
          />
        )}
      </ToolContent>
    </Tool>
  );
}
