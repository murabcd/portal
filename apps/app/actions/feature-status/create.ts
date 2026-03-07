"use client";

import { postAction } from "@/lib/action-client";
import type { createStatus as createStatusServer } from "./create.service";

export const createStatus = (...args: Parameters<typeof createStatusServer>) =>
  postAction<Awaited<ReturnType<typeof createStatusServer>>>(
    "/api/actions/feature-status/create",
    {
      action: "createStatus",
      args,
    }
  );
