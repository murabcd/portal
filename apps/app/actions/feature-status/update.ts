"use client";

import { postAction } from "@/lib/action-client";
import type { updateStatus as updateStatusServer } from "./update.service";

export const updateStatus = (...args: Parameters<typeof updateStatusServer>) =>
  postAction<Awaited<ReturnType<typeof updateStatusServer>>>(
    "/api/actions/feature-status/update",
    {
      action: "updateStatus",
      args,
    }
  );
