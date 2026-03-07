"use client";

import { postAction } from "@/lib/action-client";
import type { addOrganizationToUser as addOrganizationToUserServer } from "./add-organization-to-user.service";

export const addOrganizationToUser = (
  ...args: Parameters<typeof addOrganizationToUserServer>
) =>
  postAction<Awaited<ReturnType<typeof addOrganizationToUserServer>>>(
    "/api/internal-actions/components/feedback-form/add-organization-to-user",
    {
      action: "addOrganizationToUser",
      args,
    }
  );
