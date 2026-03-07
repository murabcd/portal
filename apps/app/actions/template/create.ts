"use client";

import { postAction } from "@/lib/action-client";
import type {
  createTemplateFromFeature as createTemplateFromFeatureServer,
  createTemplate as createTemplateServer,
} from "./create.service";

export const createTemplate = (
  ...args: Parameters<typeof createTemplateServer>
) =>
  postAction<Awaited<ReturnType<typeof createTemplateServer>>>(
    "/api/actions/template/create",
    {
      action: "createTemplate",
      args,
    }
  );
export const createTemplateFromFeature = (
  ...args: Parameters<typeof createTemplateFromFeatureServer>
) =>
  postAction<Awaited<ReturnType<typeof createTemplateFromFeatureServer>>>(
    "/api/actions/template/create",
    {
      action: "createTemplateFromFeature",
      args,
    }
  );
