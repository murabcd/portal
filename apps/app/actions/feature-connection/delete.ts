"use client";

import { postAction } from "@/lib/action-client";
import type { disconnectFeature as disconnectFeatureServer } from "./delete.service";

export const disconnectFeature = (
  ...args: Parameters<typeof disconnectFeatureServer>
) =>
  postAction<Awaited<ReturnType<typeof disconnectFeatureServer>>>(
    "/api/actions/feature-connection/delete",
    {
      action: "disconnectFeature",
      args,
    }
  );
