"use client";

import { postAction } from "@/lib/action-client";
import type { updateChangelog as updateChangelogServer } from "./update.service";

export const updateChangelog = (
  ...args: Parameters<typeof updateChangelogServer>
) =>
  postAction<Awaited<ReturnType<typeof updateChangelogServer>>>(
    "/api/actions/changelog/update",
    {
      action: "updateChangelog",
      args,
    }
  );
