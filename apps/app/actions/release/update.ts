"use server";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { Release } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const updateRelease = async (
  id: Release["id"],
  data: Partial<Release>
): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to update a release");
    }

    await database
      .update(tables.release)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(tables.release.id, id));

    revalidatePath("/releases");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
