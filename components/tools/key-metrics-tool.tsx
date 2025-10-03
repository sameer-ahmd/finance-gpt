import type { ChatMessage } from "@/lib/types";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../elements/tool";
import { Table } from "../Table";

type KeyMetricsPart = Extract<
  ChatMessage["parts"][number],
  { type: "tool-getKeyMetrics" }
>;

export function KeyMetricsTool({ part }: { part: KeyMetricsPart }) {
  const { toolCallId, state } = part;

  return (
    <Tool defaultOpen={false} key={toolCallId}>
      <ToolHeader state={state} type="tool-getKeyMetrics" />
      <ToolContent>
        {state === "input-available" && <ToolInput input={part.input} />}
        {state === "output-available" && (
          <ToolOutput
            errorText={part.errorText}
            output={
              <Table
                data={part.output.rows || []}
                caption={`${part.output.symbol} Key Metrics (${part.output.period})`}
                maxRows={8}
              />
            }
          />
        )}
      </ToolContent>
    </Tool>
  );
}
