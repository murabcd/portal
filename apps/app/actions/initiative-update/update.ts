"use client";

import { postAction } from "@/lib/action-client";
import type { updateInitiativeUpdate as updateInitiativeUpdateServer } from "./update.service";

export const updateInitiativeUpdate = (
  ...args: Parameters<typeof updateInitiativeUpdateServer>
) =>
  postAction<Awaited<ReturnType<typeof updateInitiativeUpdateServer>>>(
    "/api/actions/initiative-update/update",
    {
      action: "updateInitiativeUpdate",
      args,
    }
  );
