"use client";

import { postAction } from "@/lib/action-client";
import type { updateOrganization as updateOrganizationServer } from "./update.service";

export const updateOrganization = (
  ...args: Parameters<typeof updateOrganizationServer>
) =>
  postAction<Awaited<ReturnType<typeof updateOrganizationServer>>>(
    "/api/actions/organization/update",
    {
      action: "updateOrganization",
      args,
    }
  );
