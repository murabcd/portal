"use client";

import { postAction } from "@/lib/action-client";
import type { createInitiativeFile as createInitiativeFileServer } from "./create.service";

export const createInitiativeFile = (
  ...args: Parameters<typeof createInitiativeFileServer>
) =>
  postAction<Awaited<ReturnType<typeof createInitiativeFileServer>>>(
    "/api/actions/initiative-file/create",
    {
      action: "createInitiativeFile",
      args,
    }
  );
