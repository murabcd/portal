"use client";

import { postAction } from "@/lib/action-client";
import type { deleteInitiativeMember as deleteInitiativeMemberServer } from "./delete.service";

export const deleteInitiativeMember = (
  ...args: Parameters<typeof deleteInitiativeMemberServer>
) =>
  postAction<Awaited<ReturnType<typeof deleteInitiativeMemberServer>>>(
    "/api/actions/initiative-member/delete",
    {
      action: "deleteInitiativeMember",
      args,
    }
  );
