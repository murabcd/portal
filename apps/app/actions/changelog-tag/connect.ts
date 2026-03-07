"use client";

import { postAction } from "@/lib/action-client";
import type { addChangelogTag as addChangelogTagServer } from "./connect.service";

export const addChangelogTag = (
  ...args: Parameters<typeof addChangelogTagServer>
) =>
  postAction<Awaited<ReturnType<typeof addChangelogTagServer>>>(
    "/api/actions/changelog-tag/connect",
    {
      action: "addChangelogTag",
      args,
    }
  );
