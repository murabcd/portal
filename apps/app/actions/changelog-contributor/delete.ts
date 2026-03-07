"use client";

import { postAction } from "@/lib/action-client";
import type { deleteChangelogContributor as deleteChangelogContributorServer } from "./delete.service";

export const deleteChangelogContributor = (
  ...args: Parameters<typeof deleteChangelogContributorServer>
) =>
  postAction<Awaited<ReturnType<typeof deleteChangelogContributorServer>>>(
    "/api/actions/changelog-contributor/delete",
    {
      action: "deleteChangelogContributor",
      args,
    }
  );
