import "server-only";

import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { InitiativeUpdate } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const createInitiativeUpdate = async (
  initiativeId: string,
  data: Pick<InitiativeUpdate, "title">
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

    const organization = await database
      .select({ id: tables.organization.id })
      .from(tables.organization)
      .where(eq(tables.organization.id, organizationId))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!organization) {
      throw new Error("Organization not found");
    }

    const id = createId();
    const now = new Date().toISOString();

    await database.insert(tables.initiativeUpdate).values([
      {
        id,
        title: data.title,
        initiativeId,
        organizationId,
        creatorId: user.id,
        content: {},
        createdAt: now,
        updatedAt: now,
      },
    ]);

    revalidatePath(`/initiatives/${initiativeId}`);

    return { id };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
