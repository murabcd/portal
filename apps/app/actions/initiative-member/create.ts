"use client";

import { postAction } from "@/lib/action-client";
import type { addInitiativeMember as addInitiativeMemberServer } from "./create.service";

export const addInitiativeMember = (
  ...args: Parameters<typeof addInitiativeMemberServer>
) =>
  postAction<Awaited<ReturnType<typeof addInitiativeMemberServer>>>(
    "/api/actions/initiative-member/create",
    {
      action: "addInitiativeMember",
      args,
    }
  );
