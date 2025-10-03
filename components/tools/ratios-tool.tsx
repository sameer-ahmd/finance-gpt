import type { ChatMessage } from "@/lib/types";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../elements/tool";
import { Table } from "../Table";

type RatiosPart = Extract<
  ChatMessage["parts"][number],
  { type: "tool-getRatios" }
>;

export function RatiosTool({ part }: { part: RatiosPart }) {
  const { toolCallId, state } = part;

  return (
    <Tool defaultOpen={false} key={toolCallId}>
      <ToolHeader state={state} type="tool-getRatios" />
      <ToolContent>
        {state === "input-available" && <ToolInput input={part.input} />}
        {state === "output-available" && (
          <ToolOutput
            errorText={part.errorText}
            output={
              <Table
                data={part.output.rows || []}
                caption={`${part.output.symbol} Financial Ratios (${part.output.period})`}
                maxRows={8}
              />
            }
          />
        )}
      </ToolContent>
    </Tool>
  );
}
