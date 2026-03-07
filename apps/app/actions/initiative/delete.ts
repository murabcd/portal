"use client";

import { postAction } from "@/lib/action-client";
import type { deleteInitiative as deleteInitiativeServer } from "./delete.service";

export const deleteInitiative = (
  ...args: Parameters<typeof deleteInitiativeServer>
) =>
  postAction<Awaited<ReturnType<typeof deleteInitiativeServer>>>(
    "/api/actions/initiative/delete",
    {
      action: "deleteInitiative",
      args,
    }
  );
