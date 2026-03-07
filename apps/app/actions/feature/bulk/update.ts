"use server";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { Feature } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const updateFeatures = async (
  featureIds: Feature["id"][],
  data: Omit<Partial<Feature>, "content" | "canvas">
): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to update features");
    }

    if (featureIds.length > 0) {
      await database
        .update(tables.feature)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(inArray(tables.feature.id, featureIds));
    }

    revalidatePath("/features");
    revalidatePath("/roadmap");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
