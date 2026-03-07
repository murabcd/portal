"use client";

import { postAction } from "@/lib/action-client";
import type { deleteGroup as deleteGroupServer } from "./delete.service";

export const deleteGroup = (...args: Parameters<typeof deleteGroupServer>) =>
  postAction<Awaited<ReturnType<typeof deleteGroupServer>>>(
    "/api/actions/group/delete",
    {
      action: "deleteGroup",
      args,
    }
  );
