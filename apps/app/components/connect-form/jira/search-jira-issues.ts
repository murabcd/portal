"use client";

export type { SearchJiraIssuesResponse } from "./search-jira-issues.service";

import { postAction } from "@/lib/action-client";
import type { searchJiraIssues as searchJiraIssuesServer } from "./search-jira-issues.service";

export const searchJiraIssues = (
  ...args: Parameters<typeof searchJiraIssuesServer>
) =>
  postAction<Awaited<ReturnType<typeof searchJiraIssuesServer>>>(
    "/api/internal-actions/components/connect-form/jira/search-jira-issues",
    {
      action: "searchJiraIssues",
      args,
    }
  );
