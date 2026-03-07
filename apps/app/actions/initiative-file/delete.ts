"use client";

import { postAction } from "@/lib/action-client";
import type { deleteInitiativeFile as deleteInitiativeFileServer } from "./delete.service";

export const deleteInitiativeFile = (
  ...args: Parameters<typeof deleteInitiativeFileServer>
) =>
  postAction<Awaited<ReturnType<typeof deleteInitiativeFileServer>>>(
    "/api/actions/initiative-file/delete",
    {
      action: "deleteInitiativeFile",
      args,
    }
  );
