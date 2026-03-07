"use client";

import { postAction } from "@/lib/action-client";
import type { createChangelogTag as createChangelogTagServer } from "./create.service";

export const createChangelogTag = (
  ...args: Parameters<typeof createChangelogTagServer>
) =>
  postAction<Awaited<ReturnType<typeof createChangelogTagServer>>>(
    "/api/actions/changelog-tag/create",
    {
      action: "createChangelogTag",
      args,
    }
  );
