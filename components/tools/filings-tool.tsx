import type { ChatMessage } from "@/lib/types";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../elements/tool";
import { Table } from "../Table";

type FilingsPart = Extract<
  ChatMessage["parts"][number],
  { type: "tool-getFilings" }
>;

export function FilingsTool({ part }: { part: FilingsPart }) {
  const { toolCallId, state } = part;

  return (
    <Tool defaultOpen={false} key={toolCallId}>
      <ToolHeader state={state} type="tool-getFilings" />
      <ToolContent>
        {state === "input-available" && <ToolInput input={part.input} />}
        {state === "output-available" && (
          <ToolOutput
            errorText={part.errorText}
            output={
              <Table
                data={part.output.rows || []}
                caption={`${part.output.symbol} SEC Filings`}
                maxRows={10}
              />
            }
          />
        )}
      </ToolContent>
    </Tool>
  );
}
