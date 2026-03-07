import "server-only";

import { tables } from "@repo/backend/database";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const updateFeatureStatuses = async (
  ids: (typeof tables.featureStatus.$inferSelect)["id"][]
): Promise<{
  error?: string;
}> => {
  try {
    await database.transaction(async (tx) => {
      for (const [index, id] of ids.entries()) {
        await tx
          .update(tables.featureStatus)
          .set({ order: index, updatedAt: new Date().toISOString() })
          .where(eq(tables.featureStatus.id, id));
      }
    });

    revalidatePath("/settings");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
