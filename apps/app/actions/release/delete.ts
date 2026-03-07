"use client";

import { postAction } from "@/lib/action-client";
import type { deleteRelease as deleteReleaseServer } from "./delete.service";

export const deleteRelease = (
  ...args: Parameters<typeof deleteReleaseServer>
) =>
  postAction<Awaited<ReturnType<typeof deleteReleaseServer>>>(
    "/api/actions/release/delete",
    {
      action: "deleteRelease",
      args,
    }
  );
