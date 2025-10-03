import type { ChatMessage } from "@/lib/types";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../elements/tool";

type CAGRPart = Extract<
  ChatMessage["parts"][number],
  { type: "tool-calculateCAGRTool" }
>;

export function CAGRTool({ part }: { part: CAGRPart }) {
  const { toolCallId, state } = part;

  return (
    <Tool defaultOpen={false} key={toolCallId}>
      <ToolHeader state={state} type="tool-calculateCAGRTool" />
      <ToolContent>
        {state === "input-available" && <ToolInput input={part.input} />}
        {state === "output-available" && (
          <ToolOutput
            errorText={part.errorText}
            output={
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap">{part.output}</div>
              </div>
            }
          />
        )}
      </ToolContent>
    </Tool>
  );
}
