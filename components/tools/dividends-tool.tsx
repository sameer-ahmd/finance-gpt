import type { ChatMessage } from "@/lib/types";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../elements/tool";
import { Table } from "../Table";

type DividendsPart = Extract<
  ChatMessage["parts"][number],
  { type: "tool-getDividends" }
>;

export function DividendsTool({ part }: { part: DividendsPart }) {
  const { toolCallId, state } = part;

  return (
    <Tool defaultOpen={false} key={toolCallId}>
      <ToolHeader state={state} type="tool-getDividends" />
      <ToolContent>
        {state === "input-available" && <ToolInput input={part.input} />}
        {state === "output-available" && (
          <ToolOutput
            errorText={part.errorText}
            output={
              part.output.rows && part.output.rows.length > 0 ? (
                <Table
                  data={part.output.rows}
                  caption={`${part.output.symbol} Dividend History`}
                  maxRows={10}
                />
              ) : (
                <div className="text-sm text-gray-500 italic">
                  {part.output.message || 'No dividend history available'}
                </div>
              )
            }
          />
        )}
      </ToolContent>
    </Tool>
  );
}
