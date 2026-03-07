"use client";

import { postAction } from "@/lib/action-client";
import type { createInitiativeLink as createInitiativeLinkServer } from "./create.service";

export const createInitiativeLink = (
  ...args: Parameters<typeof createInitiativeLinkServer>
) =>
  postAction<Awaited<ReturnType<typeof createInitiativeLinkServer>>>(
    "/api/actions/initiative-link/create",
    {
      action: "createInitiativeLink",
      args,
    }
  );
