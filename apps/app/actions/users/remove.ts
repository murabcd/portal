"use client";

import { postAction } from "@/lib/action-client";
import type { removeUser as removeUserServer } from "./remove.service";

export const removeUser = (...args: Parameters<typeof removeUserServer>) =>
  postAction<Awaited<ReturnType<typeof removeUserServer>>>(
    "/api/actions/users/remove",
    {
      action: "removeUser",
      args,
    }
  );
