import "server-only";

import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const createChangelog = async (
  title: string
): Promise<{
  id?: string;
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

    const id = createId();
    const now = new Date().toISOString();

    await database.insert(tables.changelog).values([
      {
        id,
        title,
        organizationId,
        creatorId: user.id,
        createdAt: now,
        updatedAt: now,
        publishAt: now,
      },
    ]);

    await database.insert(tables.changelogContributor).values([
      {
        id: createId(),
        organizationId,
        changelogId: id,
        userId: user.id,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    revalidatePath("/changelog", "layout");

    return { id };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
