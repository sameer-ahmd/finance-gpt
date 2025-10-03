import type { ChatMessage } from "@/lib/types";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../elements/tool";
import { Table } from "../Table";

type SearchCompanyPart = Extract<
  ChatMessage["parts"][number],
  { type: "tool-searchCompany" }
>;

export function SearchCompanyTool({ part }: { part: SearchCompanyPart }) {
  const { toolCallId, state } = part;

  return (
    <Tool defaultOpen={false} key={toolCallId}>
      <ToolHeader state={state} type="tool-searchCompany" />
      <ToolContent>
        {state === "input-available" && <ToolInput input={part.input} />}
        {state === "output-available" && (
          <ToolOutput
            errorText={part.errorText}
            output={
              <Table
                data={part.output.results || []}
                caption={`Search results for "${part.output.query}"`}
              />
            }
          />
        )}
      </ToolContent>
    </Tool>
  );
}
