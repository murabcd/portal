"use client";

import { postAction } from "@/lib/action-client";
import type { updateJiraStatusMappings as updateJiraStatusMappingsServer } from "./update.service";

export const updateJiraStatusMappings = (
  ...args: Parameters<typeof updateJiraStatusMappingsServer>
) =>
  postAction<Awaited<ReturnType<typeof updateJiraStatusMappingsServer>>>(
    "/api/actions/installation-status-mapping/jira/update",
    {
      action: "updateJiraStatusMappings",
      args,
    }
  );
