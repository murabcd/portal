"use client";

import { postAction } from "@/lib/action-client";
import type { updateGroup as updateGroupServer } from "./update.service";

export const updateGroup = (...args: Parameters<typeof updateGroupServer>) =>
  postAction<Awaited<ReturnType<typeof updateGroupServer>>>(
    "/api/actions/group/update",
    {
      action: "updateGroup",
      args,
    }
  );
