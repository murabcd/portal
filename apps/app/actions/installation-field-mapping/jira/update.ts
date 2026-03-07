"use client";

import { postAction } from "@/lib/action-client";
import type { updateJiraFieldMappings as updateJiraFieldMappingsServer } from "./update.service";

export const updateJiraFieldMappings = (
  ...args: Parameters<typeof updateJiraFieldMappingsServer>
) =>
  postAction<Awaited<ReturnType<typeof updateJiraFieldMappingsServer>>>(
    "/api/actions/installation-field-mapping/jira/update",
    {
      action: "updateJiraFieldMappings",
      args,
    }
  );
