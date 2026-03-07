import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { FeatureStatus } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const deleteStatus = async (
  id: FeatureStatus["id"],
  destinationId: FeatureStatus["id"]
): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to delete statuses");
    }

    await database
      .update(tables.feature)
      .set({ statusId: destinationId })
      .where(eq(tables.feature.statusId, id));

    await database
      .delete(tables.featureStatus)
      .where(eq(tables.featureStatus.id, id));

    revalidatePath("/settings/statuses");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
