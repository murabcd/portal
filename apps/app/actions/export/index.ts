"use client";

import { postAction } from "@/lib/action-client";
import type { exportAll as exportAllServer } from "./index.service";

export const exportAll = (...args: Parameters<typeof exportAllServer>) =>
  postAction<Awaited<ReturnType<typeof exportAllServer>>>(
    "/api/actions/export",
    {
      action: "exportAll",
      args,
    }
  );
