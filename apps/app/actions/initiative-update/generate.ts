"use client";

import { postAction } from "@/lib/action-client";
import type { generateInitiativeUpdateContent as generateInitiativeUpdateContentServer } from "./generate.service";

export const generateInitiativeUpdateContent = (
  ...args: Parameters<typeof generateInitiativeUpdateContentServer>
) =>
  postAction<Awaited<ReturnType<typeof generateInitiativeUpdateContentServer>>>(
    "/api/actions/initiative-update/generate",
    {
      action: "generateInitiativeUpdateContent",
      args,
    }
  );
