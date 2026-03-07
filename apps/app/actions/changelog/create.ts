"use client";

import { postAction } from "@/lib/action-client";
import type { createChangelog as createChangelogServer } from "./create.service";

export const createChangelog = (
  ...args: Parameters<typeof createChangelogServer>
) =>
  postAction<Awaited<ReturnType<typeof createChangelogServer>>>(
    "/api/actions/changelog/create",
    {
      action: "createChangelog",
      args,
    }
  );
