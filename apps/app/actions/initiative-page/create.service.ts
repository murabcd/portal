import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { Initiative, InitiativePage } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const createInitiativePage = async (
  initiativeId: Initiative["id"],
  title: InitiativePage["title"],
  type: string
): Promise<
  | {
      error: string;
    }
  | {
      id: InitiativePage["id"];
    }
> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to create pages");
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

    let pageId = "";

    const now = new Date().toISOString();

    if (type === "document") {
      pageId = createId();
      await database.insert(tables.initiativePage).values([
        {
          id: pageId,
          organizationId: organization.id,
          title,
          initiativeId,
          creatorId: user.id,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    if (type === "canvas") {
      pageId = createId();
      await database.insert(tables.initiativeCanvas).values([
        {
          id: pageId,
          organizationId: organization.id,
          title,
          initiativeId,
          creatorId: user.id,
          content: {},
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    revalidatePath(`/initiatives/${initiativeId}`);

    return { id: pageId };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
