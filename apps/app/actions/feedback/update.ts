"use client";

import { postAction } from "@/lib/action-client";
import type { updateFeedback as updateFeedbackServer } from "./update.service";

export const updateFeedback = (
  ...args: Parameters<typeof updateFeedbackServer>
) =>
  postAction<Awaited<ReturnType<typeof updateFeedbackServer>>>(
    "/api/actions/feedback/update",
    {
      action: "updateFeedback",
      args,
    }
  );
