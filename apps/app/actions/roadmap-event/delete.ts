"use client";

import { postAction } from "@/lib/action-client";
import type { deleteMarker as deleteMarkerServer } from "./delete.service";

export const deleteMarker = (...args: Parameters<typeof deleteMarkerServer>) =>
  postAction<Awaited<ReturnType<typeof deleteMarkerServer>>>(
    "/api/actions/roadmap-event/delete",
    {
      action: "deleteMarker",
      args,
    }
  );
