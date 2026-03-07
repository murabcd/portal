"use client";

import { postAction } from "@/lib/action-client";
import type { createOrganization as createOrganizationServer } from "./create.service";

export const createOrganization = (
  ...args: Parameters<typeof createOrganizationServer>
) =>
  postAction<Awaited<ReturnType<typeof createOrganizationServer>>>(
    "/api/actions/organization/create",
    {
      action: "createOrganization",
      args,
    }
  );
