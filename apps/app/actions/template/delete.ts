"use client";

import { postAction } from "@/lib/action-client";
import type { deleteTemplate as deleteTemplateServer } from "./delete.service";

export const deleteTemplate = (
  ...args: Parameters<typeof deleteTemplateServer>
) =>
  postAction<Awaited<ReturnType<typeof deleteTemplateServer>>>(
    "/api/actions/template/delete",
    {
      action: "deleteTemplate",
      args,
    }
  );
