"use client";

export type { GetJiraTypesResponse } from "./get-jira-types.service";

import { postAction } from "@/lib/action-client";
import type { getJiraTypes as getJiraTypesServer } from "./get-jira-types.service";

export const getJiraTypes = (...args: Parameters<typeof getJiraTypesServer>) =>
  postAction<Awaited<ReturnType<typeof getJiraTypesServer>>>(
    "/api/internal-actions/components/connect-form/jira/get-jira-types",
    {
      action: "getJiraTypes",
      args,
    }
  );
