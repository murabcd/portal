"use client";

import { postAction } from "@/lib/action-client";
import type { createFeedbackOrganization as createFeedbackOrganizationServer } from "./create.service";

export const createFeedbackOrganization = (
  ...args: Parameters<typeof createFeedbackOrganizationServer>
) =>
  postAction<Awaited<ReturnType<typeof createFeedbackOrganizationServer>>>(
    "/api/actions/feedback-organization/create",
    {
      action: "createFeedbackOrganization",
      args,
    }
  );
