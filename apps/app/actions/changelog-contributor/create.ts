"use client";

import { postAction } from "@/lib/action-client";
import type { addChangelogContributor as addChangelogContributorServer } from "./create.service";

export const addChangelogContributor = (
  ...args: Parameters<typeof addChangelogContributorServer>
) =>
  postAction<Awaited<ReturnType<typeof addChangelogContributorServer>>>(
    "/api/actions/changelog-contributor/create",
    {
      action: "addChangelogContributor",
      args,
    }
  );
