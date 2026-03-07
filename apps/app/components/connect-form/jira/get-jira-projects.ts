"use client";

export type { GetJiraProjectsResponse } from "./get-jira-projects.service";

import { postAction } from "@/lib/action-client";
import type { getJiraProjects as getJiraProjectsServer } from "./get-jira-projects.service";

export const getJiraProjects = (
  ...args: Parameters<typeof getJiraProjectsServer>
) =>
  postAction<Awaited<ReturnType<typeof getJiraProjectsServer>>>(
    "/api/internal-actions/components/connect-form/jira/get-jira-projects",
    {
      action: "getJiraProjects",
      args,
    }
  );
