"use client";

import { postAction } from "@/lib/action-client";
import type { createAtlassianInstallation as createAtlassianInstallationServer } from "./create.service";

export const createAtlassianInstallation = (
  ...args: Parameters<typeof createAtlassianInstallationServer>
) =>
  postAction<Awaited<ReturnType<typeof createAtlassianInstallationServer>>>(
    "/api/actions/atlassian-installation/create",
    {
      action: "createAtlassianInstallation",
      args,
    }
  );
