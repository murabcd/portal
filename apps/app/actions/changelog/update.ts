"use server";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import type { Changelog } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const updateChangelog = async (
  changelogId: Changelog["id"],
  data: Omit<Partial<Changelog>, "content"> & {
    content?: JsonValue;
  }
): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You do not have permission to update changelogs");
    }

    const { id: _ignored, ...updates } = data;

    await database
      .update(tables.changelog)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(tables.changelog.id, changelogId));

    revalidatePath(`/changelog/${changelogId}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
