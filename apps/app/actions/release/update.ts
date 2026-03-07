"use client";

import { postAction } from "@/lib/action-client";
import type { updateRelease as updateReleaseServer } from "./update.service";

export const updateRelease = (
  ...args: Parameters<typeof updateReleaseServer>
) =>
  postAction<Awaited<ReturnType<typeof updateReleaseServer>>>(
    "/api/actions/release/update",
    {
      action: "updateRelease",
      args,
    }
  );
