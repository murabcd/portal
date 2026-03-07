"use client";

import { postAction } from "@/lib/action-client";
import type { createRelease as createReleaseServer } from "./create.service";

export const createRelease = (
  ...args: Parameters<typeof createReleaseServer>
) =>
  postAction<Awaited<ReturnType<typeof createReleaseServer>>>(
    "/api/actions/release/create",
    {
      action: "createRelease",
      args,
    }
  );
