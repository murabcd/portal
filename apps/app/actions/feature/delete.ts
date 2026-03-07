"use client";

import { postAction } from "@/lib/action-client";
import type { deleteFeature as deleteFeatureServer } from "./delete.service";

export const deleteFeature = (
  ...args: Parameters<typeof deleteFeatureServer>
) =>
  postAction<Awaited<ReturnType<typeof deleteFeatureServer>>>(
    "/api/actions/feature/delete",
    {
      action: "deleteFeature",
      args,
    }
  );
