"use client";

import { postAction } from "@/lib/action-client";
import type { deleteInitiativeLink as deleteInitiativeLinkServer } from "./delete.service";

export const deleteInitiativeLink = (
  ...args: Parameters<typeof deleteInitiativeLinkServer>
) =>
  postAction<Awaited<ReturnType<typeof deleteInitiativeLinkServer>>>(
    "/api/actions/initiative-link/delete",
    {
      action: "deleteInitiativeLink",
      args,
    }
  );
