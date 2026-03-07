"use client";

import { postAction } from "@/lib/action-client";
import type { deleteChangelog as deleteChangelogServer } from "./delete.service";

export const deleteChangelog = (
  ...args: Parameters<typeof deleteChangelogServer>
) =>
  postAction<Awaited<ReturnType<typeof deleteChangelogServer>>>(
    "/api/actions/changelog/delete",
    {
      action: "deleteChangelog",
      args,
    }
  );
