"use server";

import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { Feature, FeatureRice } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

type UpdateRiceProperties = {
  featureId: Feature["id"];
  reach: FeatureRice["reach"] | undefined;
  impact: FeatureRice["impact"] | undefined;
  confidence: FeatureRice["confidence"] | undefined;
  effort: FeatureRice["effort"] | undefined;
};

export const updateRice = async ({
  featureId,
  reach = 1,
  impact = 1,
  confidence = 1,
  effort = 1,
}: UpdateRiceProperties): Promise<{
  error?: string;
}> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to update RICE");
    }

    const now = new Date().toISOString();
    await database
      .insert(tables.featureRice)
      .values([
        {
          id: createId(),
          featureId,
          reach,
          impact,
          confidence,
          effort,
          organizationId,
          updatedAt: now,
        },
      ])
      .onConflictDoUpdate({
        target: tables.featureRice.featureId,
        set: {
          reach,
          impact,
          confidence,
          effort,
          updatedAt: now,
        },
      });

    revalidatePath("/features");
    revalidatePath(`/features/${featureId}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
