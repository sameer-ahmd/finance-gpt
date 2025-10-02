"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const suggestedActions = [
    "Summarize Spotify's latest conference call.",
    "What has Airbnb management said about profitability over the last few earnings calls?",
    "What was Crowdstrike revenue in the past 3, 5, and 10 years",
    "What was Crowdstrike's revenue growth in the past 3, 5, and 10 years",
  ];

  return (
    <ScrollArea className="w-full" data-testid="suggested-actions">
      <div className="flex gap-2 pb-2">
        {suggestedActions.map((suggestedAction, index) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            initial={{ opacity: 0, y: 20 }}
            key={suggestedAction}
            transition={{ delay: 0.05 * index }}
          >
            <Suggestion
              className="whitespace-nowrap p-3"
              onClick={(suggestion) => {
                window.history.replaceState({}, "", `/chat/${chatId}`);
                sendMessage({
                  role: "user",
                  parts: [{ type: "text", text: suggestion }],
                });
              }}
              suggestion={suggestedAction}
            >
              {suggestedAction}
            </Suggestion>
          </motion.div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
