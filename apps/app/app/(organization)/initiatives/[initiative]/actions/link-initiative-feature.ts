"use client";

import { postAction } from "@/lib/action-client";
import type { linkInitiativeFeature as linkInitiativeFeatureServer } from "./link-initiative-feature.service";

export const linkInitiativeFeature = (
  ...args: Parameters<typeof linkInitiativeFeatureServer>
) =>
  postAction<Awaited<ReturnType<typeof linkInitiativeFeatureServer>>>(
    "/api/internal-actions/app/(organization)/initiatives/[initiative]/actions/link-initiative-feature",
    {
      action: "linkInitiativeFeature",
      args,
    }
  );
