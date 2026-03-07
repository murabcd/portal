"use client";

import { postAction } from "@/lib/action-client";
import type {
  updateTemplateFromFeature as updateTemplateFromFeatureServer,
  updateTemplate as updateTemplateServer,
} from "./update.service";

export const updateTemplate = (
  ...args: Parameters<typeof updateTemplateServer>
) =>
  postAction<Awaited<ReturnType<typeof updateTemplateServer>>>(
    "/api/actions/template/update",
    {
      action: "updateTemplate",
      args,
    }
  );
export const updateTemplateFromFeature = (
  ...args: Parameters<typeof updateTemplateFromFeatureServer>
) =>
  postAction<Awaited<ReturnType<typeof updateTemplateFromFeatureServer>>>(
    "/api/actions/template/update",
    {
      action: "updateTemplateFromFeature",
      args,
    }
  );
