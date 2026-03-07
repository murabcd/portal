"use client";

import { postAction } from "@/lib/action-client";
import type { createInitiativeUpdate as createInitiativeUpdateServer } from "./create.service";

export const createInitiativeUpdate = (
  ...args: Parameters<typeof createInitiativeUpdateServer>
) =>
  postAction<Awaited<ReturnType<typeof createInitiativeUpdateServer>>>(
    "/api/actions/initiative-update/create",
    {
      action: "createInitiativeUpdate",
      args,
    }
  );
