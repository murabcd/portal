import "server-only";

import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { FeatureStatus } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const createStatus = async (
  name: FeatureStatus["name"],
  color: FeatureStatus["color"],
  complete: FeatureStatus["complete"]
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

    const databaseOrganization = await database
      .select({ id: tables.organization.id })
      .from(tables.organization)
      .where(eq(tables.organization.id, organizationId))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!databaseOrganization) {
      throw new Error("Organization not found");
    }

    const highestOrder = await database
      .select({ order: tables.featureStatus.order })
      .from(tables.featureStatus)
      .where(eq(tables.featureStatus.organizationId, organizationId))
      .orderBy(desc(tables.featureStatus.order))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    const order = highestOrder ? highestOrder.order + 1 : 0;

    const now = new Date().toISOString();
    await database.insert(tables.featureStatus).values([
      {
        id: createId(),
        name,
        color,
        complete,
        order,
        organizationId,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    revalidatePath("/settings/statuses");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
