import type { ChatMessage } from "@/lib/types";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../elements/tool";
import { Table } from "../Table";

type SharesOutstandingPart = Extract<
  ChatMessage["parts"][number],
  { type: "tool-getSharesOutstanding" }
>;

export function SharesOutstandingTool({ part }: { part: SharesOutstandingPart }) {
  const { toolCallId, state } = part;

  return (
    <Tool defaultOpen={false} key={toolCallId}>
      <ToolHeader state={state} type="tool-getSharesOutstanding" />
      <ToolContent>
        {state === "input-available" && <ToolInput input={part.input} />}
        {state === "output-available" && (
          <ToolOutput
            errorText={part.errorText}
            output={
              <Table
                data={part.output.rows || []}
                caption={`${part.output.symbol} Shares Outstanding`}
                maxRows={8}
              />
            }
          />
        )}
      </ToolContent>
    </Tool>
  );
}
