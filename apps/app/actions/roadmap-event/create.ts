"use client";

import { postAction } from "@/lib/action-client";
import type { createMarker as createMarkerServer } from "./create.service";

export const createMarker = (...args: Parameters<typeof createMarkerServer>) =>
  postAction<Awaited<ReturnType<typeof createMarkerServer>>>(
    "/api/actions/roadmap-event/create",
    {
      action: "createMarker",
      args,
    }
  );
