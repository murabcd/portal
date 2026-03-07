"use client";

import { Emoji } from "@repo/design-system/components/emoji";
import { EmojiSelector } from "@repo/design-system/components/emoji-selector";
import { handleError } from "@repo/design-system/lib/handle-error";
import { cn } from "@repo/design-system/lib/utils";
import { useState } from "react";
import { updateInitiative } from "@/actions/initiative/update";

type InitiativeEmojiProperties = {
  readonly initiativeId: string;
  readonly defaultEmoji: string;
  readonly editable: boolean;
};

export const InitiativeEmoji = ({
  initiativeId,
  defaultEmoji,
  editable,
}: InitiativeEmojiProperties) => {
  const [loading, setLoading] = useState(false);
  const [pendingEmoji, setPendingEmoji] = useState<string | undefined>();
  const emoji = pendingEmoji ?? defaultEmoji;

  const handleChange = async (newEmoji: string): Promise<void> => {
    setPendingEmoji(newEmoji);
    setLoading(true);

    try {
      const response = await updateInitiative(initiativeId, {
        emoji: newEmoji,
      });

      if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      setPendingEmoji(undefined);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  if (!editable) {
    return (
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg border bg-background shadow-sm",
          loading ? "pointer-events-none opacity-50" : ""
        )}
      >
        <Emoji id={emoji} size="1.5rem" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-fit rounded-lg border bg-background shadow-sm",
        loading ? "pointer-events-none opacity-50" : ""
      )}
    >
      <EmojiSelector
        large
        onChange={handleChange}
        onError={handleError}
        value={emoji}
      />
    </div>
  );
};
