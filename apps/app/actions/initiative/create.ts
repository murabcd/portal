"use client";

import { postAction } from "@/lib/action-client";
import type { createInitiative as createInitiativeServer } from "./create.service";

export const createInitiative = (
  ...args: Parameters<typeof createInitiativeServer>
) =>
  postAction<Awaited<ReturnType<typeof createInitiativeServer>>>(
    "/api/actions/initiative/create",
    {
      action: "createInitiative",
      args,
    }
  );
