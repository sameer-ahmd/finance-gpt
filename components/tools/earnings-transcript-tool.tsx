import type { ChatMessage } from "@/lib/types";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../elements/tool";

type EarningsTranscriptPart = Extract<
  ChatMessage["parts"][number],
  { type: "tool-getEarningsTranscript" }
>;

export function EarningsTranscriptTool({ part }: { part: EarningsTranscriptPart }) {
  const { toolCallId, state } = part;

  const truncateText = (text: string) => {
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  };

  return (
    <Tool defaultOpen={false} key={toolCallId}>
      <ToolHeader state={state} type="tool-getEarningsTranscript" />
      <ToolContent>
        {state === "input-available" && <ToolInput input={part.input} />}
        {state === "output-available" && (
          <ToolOutput
            errorText={part.errorText}
            output={
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap">
                  {truncateText(part.output)}
                  {part.output.split('\n').filter(l => l.trim().length > 0).length > 3 && (
                    <span className="text-muted-foreground italic">... (truncated)</span>
                  )}
                </div>
              </div>
            }
          />
        )}
      </ToolContent>
    </Tool>
  );
}
