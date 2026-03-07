"use client";

import { postAction } from "@/lib/action-client";
import type { connectToJira as connectToJiraServer } from "./connect-to-jira.service";

export const connectToJira = (
  ...args: Parameters<typeof connectToJiraServer>
) =>
  postAction<Awaited<ReturnType<typeof connectToJiraServer>>>(
    "/api/internal-actions/components/connect-form/jira/connect-to-jira",
    {
      action: "connectToJira",
      args,
    }
  );
