"use server";

import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import { createId } from "@repo/backend/id";
import { textToContent } from "@repo/editor/lib/tiptap";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const createInitiative = async (
  title: string,
  emoji: string,
  ownerId: string
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
      throw new Error("You must be logged in to create an initiative.");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to create an initiative.");
    }

    const organization = await database
      .select({ id: tables.organization.id })
      .from(tables.organization)
      .where(eq(tables.organization.id, organizationId))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!organization) {
      throw new Error("Organization not found.");
    }

    const id = createId();
    const now = new Date().toISOString();

    await database.insert(tables.initiative).values([
      {
        id,
        title,
        creatorId: user.id,
        organizationId,
        ownerId,
        emoji,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await database.insert(tables.initiativePage).values([
      {
        id: createId(),
        title,
        creatorId: user.id,
        initiativeId: id,
        organizationId,
        default: true,
        content: textToContent("") as JsonValue,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await database.insert(tables.initiativeMember).values([
      {
        id: createId(),
        userId: user.id,
        initiativeId: id,
        creatorId: user.id,
        organizationId,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    revalidatePath("/initiatives");

    return { id };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
