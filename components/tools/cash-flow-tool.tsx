import type { ChatMessage } from "@/lib/types";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../elements/tool";
import { Table } from "../Table";

type CashFlowPart = Extract<
  ChatMessage["parts"][number],
  { type: "tool-getCashFlow" }
>;

export function CashFlowTool({ part }: { part: CashFlowPart }) {
  const { toolCallId, state } = part;

  return (
    <Tool defaultOpen={false} key={toolCallId}>
      <ToolHeader state={state} type="tool-getCashFlow" />
      <ToolContent>
        {state === "input-available" && <ToolInput input={part.input} />}
        {state === "output-available" && (
          <ToolOutput
            errorText={part.errorText}
            output={
              <Table
                data={part.output.rows || []}
                caption={`${part.output.symbol} Cash Flow (${part.output.period})`}
                maxRows={8}
              />
            }
          />
        )}
      </ToolContent>
    </Tool>
  );
}
