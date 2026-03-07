"use client";

import { postAction } from "@/lib/action-client";
import type { updateInitiativeCanvas as updateInitiativeCanvasServer } from "./update.service";

export const updateInitiativeCanvas = (
  ...args: Parameters<typeof updateInitiativeCanvasServer>
) =>
  postAction<Awaited<ReturnType<typeof updateInitiativeCanvasServer>>>(
    "/api/actions/initiative-canvas/update",
    {
      action: "updateInitiativeCanvas",
      args,
    }
  );
