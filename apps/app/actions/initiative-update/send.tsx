"use client";

import { postAction } from "@/lib/action-client";
import type { sendInitiativeUpdate as sendInitiativeUpdateServer } from "./send.service";

export const sendInitiativeUpdate = (
  ...args: Parameters<typeof sendInitiativeUpdateServer>
) =>
  postAction<Awaited<ReturnType<typeof sendInitiativeUpdateServer>>>(
    "/api/actions/initiative-update/send",
    {
      action: "sendInitiativeUpdate",
      args,
    }
  );
