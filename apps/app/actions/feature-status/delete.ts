"use client";

import { postAction } from "@/lib/action-client";
import type { deleteStatus as deleteStatusServer } from "./delete.service";

export const deleteStatus = (...args: Parameters<typeof deleteStatusServer>) =>
  postAction<Awaited<ReturnType<typeof deleteStatusServer>>>(
    "/api/actions/feature-status/delete",
    {
      action: "deleteStatus",
      args,
    }
  );
