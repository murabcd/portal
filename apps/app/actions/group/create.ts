"use client";

import { postAction } from "@/lib/action-client";
import type { createGroup as createGroupServer } from "./create.service";

export const createGroup = (...args: Parameters<typeof createGroupServer>) =>
  postAction<Awaited<ReturnType<typeof createGroupServer>>>(
    "/api/actions/group/create",
    {
      action: "createGroup",
      args,
    }
  );
