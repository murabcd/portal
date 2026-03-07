"use client";

import { postAction } from "@/lib/action-client";
import type { deleteAtlassianInstallation as deleteAtlassianInstallationServer } from "./delete.service";

export const deleteAtlassianInstallation = (
  ...args: Parameters<typeof deleteAtlassianInstallationServer>
) =>
  postAction<Awaited<ReturnType<typeof deleteAtlassianInstallationServer>>>(
    "/api/actions/atlassian-installation/delete",
    {
      action: "deleteAtlassianInstallation",
      args,
    }
  );
