"use client";

import { postAction } from "@/lib/action-client";
import type { removeChangelogTag as removeChangelogTagServer } from "./disconnect.service";

export const removeChangelogTag = (
  ...args: Parameters<typeof removeChangelogTagServer>
) =>
  postAction<Awaited<ReturnType<typeof removeChangelogTagServer>>>(
    "/api/actions/changelog-tag/disconnect",
    {
      action: "removeChangelogTag",
      args,
    }
  );
