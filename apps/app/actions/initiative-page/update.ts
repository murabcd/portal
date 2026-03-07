"use client";

import { postAction } from "@/lib/action-client";
import type { updateInitiativePage as updateInitiativePageServer } from "./update.service";

export const updateInitiativePage = (
  ...args: Parameters<typeof updateInitiativePageServer>
) =>
  postAction<Awaited<ReturnType<typeof updateInitiativePageServer>>>(
    "/api/actions/initiative-page/update",
    {
      action: "updateInitiativePage",
      args,
    }
  );
