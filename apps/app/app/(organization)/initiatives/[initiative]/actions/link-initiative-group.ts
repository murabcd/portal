"use client";

import { postAction } from "@/lib/action-client";
import type { linkInitiativeGroup as linkInitiativeGroupServer } from "./link-initiative-group.service";

export const linkInitiativeGroup = (
  ...args: Parameters<typeof linkInitiativeGroupServer>
) =>
  postAction<Awaited<ReturnType<typeof linkInitiativeGroupServer>>>(
    "/api/internal-actions/app/(organization)/initiatives/[initiative]/actions/link-initiative-group",
    {
      action: "linkInitiativeGroup",
      args,
    }
  );
