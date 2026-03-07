"use client";

import { postAction } from "@/lib/action-client";
import type { updateRice as updateRiceServer } from "./update.service";

export const updateRice = (...args: Parameters<typeof updateRiceServer>) =>
  postAction<Awaited<ReturnType<typeof updateRiceServer>>>(
    "/api/actions/feature-rice/update",
    {
      action: "updateRice",
      args,
    }
  );
