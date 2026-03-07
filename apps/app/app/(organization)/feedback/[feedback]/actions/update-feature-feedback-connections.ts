"use client";

import { postAction } from "@/lib/action-client";
import type { updateFeatureFeedbackConnections as updateFeatureFeedbackConnectionsServer } from "./update-feature-feedback-connections.service";

export const updateFeatureFeedbackConnections = (
  ...args: Parameters<typeof updateFeatureFeedbackConnectionsServer>
) =>
  postAction<
    Awaited<ReturnType<typeof updateFeatureFeedbackConnectionsServer>>
  >(
    "/api/internal-actions/app/(organization)/feedback/[feedback]/actions/update-feature-feedback-connections",
    {
      action: "updateFeatureFeedbackConnections",
      args,
    }
  );
