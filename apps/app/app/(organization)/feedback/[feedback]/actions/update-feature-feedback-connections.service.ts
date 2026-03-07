import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { Feature, Feedback } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const updateFeatureFeedbackConnections = async (
  feedbackId: Feedback["id"],
  features: Feature["id"][]
): Promise<{
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
      throw new Error(
        "You don't have permission to update feature feedback connections"
      );
    }

    const existingFeatureLinks = await database
      .select({ featureId: tables.feedbackFeatureLink.featureId })
      .from(tables.feedbackFeatureLink)
      .where(eq(tables.feedbackFeatureLink.feedbackId, feedbackId));

    // Remove existing links that are not in the new list
    const toRemove = existingFeatureLinks.filter(
      (link) => !features.includes(link.featureId)
    );

    if (toRemove.length) {
      await database.delete(tables.feedbackFeatureLink).where(
        and(
          eq(tables.feedbackFeatureLink.feedbackId, feedbackId),
          inArray(
            tables.feedbackFeatureLink.featureId,
            toRemove.map((link) => link.featureId)
          )
        )
      );
    }

    // Add new links that don't already exist
    const toAdd = features.filter(
      (featureId) =>
        !existingFeatureLinks.some((link) => link.featureId === featureId)
    );

    if (toAdd.length) {
      const now = new Date().toISOString();
      await database.insert(tables.feedbackFeatureLink).values(
        toAdd.map((featureId) => ({
          id: createId(),
          createdAt: now,
          updatedAt: now,
          feedbackId,
          featureId,
          organizationId,
          creatorId: user.id,
        }))
      );
    }

    revalidatePath("/features");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
