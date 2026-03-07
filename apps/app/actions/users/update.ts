"use client";

import { postAction } from "@/lib/action-client";
import type { updateUserRole as updateUserRoleServer } from "./update.service";

export const updateUserRole = (
  ...args: Parameters<typeof updateUserRoleServer>
) =>
  postAction<Awaited<ReturnType<typeof updateUserRoleServer>>>(
    "/api/actions/users/update",
    {
      action: "updateUserRole",
      args,
    }
  );
