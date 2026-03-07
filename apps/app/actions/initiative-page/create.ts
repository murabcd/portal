"use client";

import { postAction } from "@/lib/action-client";
import type { createInitiativePage as createInitiativePageServer } from "./create.service";

export const createInitiativePage = (
  ...args: Parameters<typeof createInitiativePageServer>
) =>
  postAction<Awaited<ReturnType<typeof createInitiativePageServer>>>(
    "/api/actions/initiative-page/create",
    {
      action: "createInitiativePage",
      args,
    }
  );
