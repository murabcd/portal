"use client";

import { postAction } from "@/lib/action-client";
import type { updateFeatures as updateFeaturesServer } from "./update.service";

export const updateFeatures = (
  ...args: Parameters<typeof updateFeaturesServer>
) =>
  postAction<Awaited<ReturnType<typeof updateFeaturesServer>>>(
    "/api/actions/feature/bulk/update",
    {
      action: "updateFeatures",
      args,
    }
  );
