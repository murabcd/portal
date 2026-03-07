"use client";

import { postAction } from "@/lib/action-client";
import type { generateChangelog as generateChangelogServer } from "./generate.service";

export const generateChangelog = (
  ...args: Parameters<typeof generateChangelogServer>
) =>
  postAction<Awaited<ReturnType<typeof generateChangelogServer>>>(
    "/api/actions/changelog/generate",
    {
      action: "generateChangelog",
      args,
    }
  );
