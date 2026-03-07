"use client";

import { postAction } from "@/lib/action-client";
import type { createAPIKey as createAPIKeyServer } from "./create.service";

export const createAPIKey = (...args: Parameters<typeof createAPIKeyServer>) =>
  postAction<Awaited<ReturnType<typeof createAPIKeyServer>>>(
    "/api/actions/api-key/create",
    {
      action: "createAPIKey",
      args,
    }
  );
