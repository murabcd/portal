"use server";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { FeatureStatus } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const updateStatus = async (
  id: FeatureStatus["id"],
  data: Partial<FeatureStatus>
): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to update statuses");
    }

    await database
      .update(tables.featureStatus)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(tables.featureStatus.id, id));

    revalidatePath("/settings");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
