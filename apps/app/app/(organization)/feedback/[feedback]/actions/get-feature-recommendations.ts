"use client";

import { postAction } from "@/lib/action-client";
import type { getFeatureRecommendations as getFeatureRecommendationsServer } from "./get-feature-recommendations.service";

export const getFeatureRecommendations = (
  ...args: Parameters<typeof getFeatureRecommendationsServer>
) =>
  postAction<Awaited<ReturnType<typeof getFeatureRecommendationsServer>>>(
    "/api/internal-actions/app/(organization)/feedback/[feedback]/actions/get-feature-recommendations",
    {
      action: "getFeatureRecommendations",
      args,
    }
  );
