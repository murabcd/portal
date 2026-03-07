"use client";

import { postAction } from "@/lib/action-client";
import type { createFeedbackUser as createFeedbackUserServer } from "./create.service";

export const createFeedbackUser = (
  ...args: Parameters<typeof createFeedbackUserServer>
) =>
  postAction<Awaited<ReturnType<typeof createFeedbackUserServer>>>(
    "/api/actions/feedback-user/create",
    {
      action: "createFeedbackUser",
      args,
    }
  );
