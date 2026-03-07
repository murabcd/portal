"use client";

import { postAction } from "@/lib/action-client";
import type {
  updateFeatureFromTemplate as updateFeatureFromTemplateServer,
  updateFeature as updateFeatureServer,
} from "./update.service";

export const updateFeature = (
  ...args: Parameters<typeof updateFeatureServer>
) =>
  postAction<Awaited<ReturnType<typeof updateFeatureServer>>>(
    "/api/actions/feature/update",
    {
      action: "updateFeature",
      args,
    }
  );
export const updateFeatureFromTemplate = (
  ...args: Parameters<typeof updateFeatureFromTemplateServer>
) =>
  postAction<Awaited<ReturnType<typeof updateFeatureFromTemplateServer>>>(
    "/api/actions/feature/update",
    {
      action: "updateFeatureFromTemplate",
      args,
    }
  );
