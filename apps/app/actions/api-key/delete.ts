"use client";

import { postAction } from "@/lib/action-client";
import type { deleteAPIKey as deleteAPIKeyServer } from "./delete.service";

export const deleteAPIKey = (...args: Parameters<typeof deleteAPIKeyServer>) =>
  postAction<Awaited<ReturnType<typeof deleteAPIKeyServer>>>(
    "/api/actions/api-key/delete",
    {
      action: "deleteAPIKey",
      args,
    }
  );
