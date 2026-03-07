"use client";

import { postAction } from "@/lib/action-client";
import type { deleteFeedback as deleteFeedbackServer } from "./delete.service";

export const deleteFeedback = (
  ...args: Parameters<typeof deleteFeedbackServer>
) =>
  postAction<Awaited<ReturnType<typeof deleteFeedbackServer>>>(
    "/api/actions/feedback/delete",
    {
      action: "deleteFeedback",
      args,
    }
  );
