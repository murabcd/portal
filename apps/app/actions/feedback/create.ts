"use client";

import { postAction } from "@/lib/action-client";
import type { createFeedback as createFeedbackServer } from "./create.service";

export const createFeedback = (
  ...args: Parameters<typeof createFeedbackServer>
) =>
  postAction<Awaited<ReturnType<typeof createFeedbackServer>>>(
    "/api/actions/feedback/create",
    {
      action: "createFeedback",
      args,
    }
  );
