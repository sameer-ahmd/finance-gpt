import type { ChatMessage } from "@/lib/types";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../elements/tool";
import { MetricTile } from "../MetricTile";

type CompanyProfilePart = Extract<
  ChatMessage["parts"][number],
  { type: "tool-getCompanyProfile" }
>;

export function CompanyProfileTool({ part }: { part: CompanyProfilePart }) {
  const { toolCallId, state } = part;

  return (
    <Tool defaultOpen={false} key={toolCallId}>
      <ToolHeader state={state} type="tool-getCompanyProfile" />
      <ToolContent>
        {state === "input-available" && <ToolInput input={part.input} />}
        {state === "output-available" && (
          <ToolOutput
            errorText={part.errorText}
            output={
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <MetricTile
                    label="Price"
                    value={part.output.price}
                    format="currency"
                  />
                  <MetricTile
                    label="Market Cap"
                    value={part.output.marketCap}
                    format="currency"
                  />
                  <MetricTile
                    label="Sector"
                    value={part.output.sector}
                    format="text"
                  />
                  <MetricTile
                    label="Industry"
                    value={part.output.industry}
                    format="text"
                  />
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="text-sm text-gray-700">{part.output.description}</p>
                </div>
              </div>
            }
          />
        )}
      </ToolContent>
    </Tool>
  );
}
