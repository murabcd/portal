"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { handleError } from "@repo/design-system/lib/handle-error";
import { CheckCircleIcon, UndoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateFeedback } from "@/actions/feedback/update";

type ProcessFeedbackButtonProperties = {
  readonly feedbackId: string;
  readonly defaultValue?: boolean;
};

export const ProcessFeedbackButton = ({
  feedbackId,
  defaultValue,
}: ProcessFeedbackButtonProperties) => {
  const [pendingProcessed, setPendingProcessed] = useState<
    boolean | undefined
  >();
  const processed = pendingProcessed ?? defaultValue;
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    const originalProcessed = processed;
    const nextProcessed = !processed;
    setPendingProcessed(nextProcessed);

    try {
      const response = await updateFeedback(feedbackId, {
        processed: nextProcessed,
      });

      if ("error" in response) {
        throw new Error(response.error);
      }

      if (!originalProcessed) {
        if ("id" in response) {
          router.push(`/feedback/${response.id}`);
        } else {
          router.push("/feedback");
        }
      }
    } catch (error) {
      setPendingProcessed(undefined);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  if (processed) {
    return (
      <Button
        className="flex items-center gap-2"
        disabled={loading}
        onClick={handleClick}
        size="sm"
        variant="ghost"
      >
        <UndoIcon className="text-muted-foreground" size={16} />
        <span>Mark feedback as unprocessed</span>
      </Button>
    );
  }

  return (
    <Button
      className="flex items-center gap-2"
      disabled={loading}
      onClick={handleClick}
      size="sm"
      variant="ghost"
    >
      <CheckCircleIcon className="text-success" size={16} />
      <span>Mark feedback as processed</span>
    </Button>
  );
};
