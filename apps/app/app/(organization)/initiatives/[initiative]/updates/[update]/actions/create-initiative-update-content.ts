"use client";

import { postAction } from "@/lib/action-client";
import type { createInitiativeUpdateContent as createInitiativeUpdateContentServer } from "./create-initiative-update-content.service";

export const createInitiativeUpdateContent = (
  ...args: Parameters<typeof createInitiativeUpdateContentServer>
) =>
  postAction<Awaited<ReturnType<typeof createInitiativeUpdateContentServer>>>(
    "/api/internal-actions/app/(organization)/initiatives/[initiative]/updates/[update]/actions/create-initiative-update-content",
    {
      action: "createInitiativeUpdateContent",
      args,
    }
  );
