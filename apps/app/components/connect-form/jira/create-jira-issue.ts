"use client";

import { postAction } from "@/lib/action-client";
import type { createJiraIssue as createJiraIssueServer } from "./create-jira-issue.service";

export const createJiraIssue = (
  ...args: Parameters<typeof createJiraIssueServer>
) =>
  postAction<Awaited<ReturnType<typeof createJiraIssueServer>>>(
    "/api/internal-actions/components/connect-form/jira/create-jira-issue",
    {
      action: "createJiraIssue",
      args,
    }
  );
