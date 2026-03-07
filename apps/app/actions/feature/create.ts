"use client";

import { postAction } from "@/lib/action-client";
import type { createFeature as createFeatureServer } from "./create.service";

export const createFeature = (
  ...args: Parameters<typeof createFeatureServer>
) =>
  postAction<Awaited<ReturnType<typeof createFeatureServer>>>(
    "/api/actions/feature/create",
    {
      action: "createFeature",
      args,
    }
  );
