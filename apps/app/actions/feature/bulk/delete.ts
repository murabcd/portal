"use client";

import { postAction } from "@/lib/action-client";
import type { deleteFeatures as deleteFeaturesServer } from "./delete.service";

export const deleteFeatures = (
  ...args: Parameters<typeof deleteFeaturesServer>
) =>
  postAction<Awaited<ReturnType<typeof deleteFeaturesServer>>>(
    "/api/actions/feature/bulk/delete",
    {
      action: "deleteFeatures",
      args,
    }
  );
