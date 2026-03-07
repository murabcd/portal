"use client";

import { postAction } from "@/lib/action-client";
import type { updateFeatureStatuses as updateFeatureStatusesServer } from "./update.service";

export const updateFeatureStatuses = (
  ...args: Parameters<typeof updateFeatureStatusesServer>
) =>
  postAction<Awaited<ReturnType<typeof updateFeatureStatusesServer>>>(
    "/api/actions/feature-status/bulk/update",
    {
      action: "updateFeatureStatuses",
      args,
    }
  );
