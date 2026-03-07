"use client";

import { postAction } from "@/lib/action-client";
import type { updateInitiative as updateInitiativeServer } from "./update.service";

export const updateInitiative = (
  ...args: Parameters<typeof updateInitiativeServer>
) =>
  postAction<Awaited<ReturnType<typeof updateInitiativeServer>>>(
    "/api/actions/initiative/update",
    {
      action: "updateInitiative",
      args,
    }
  );
