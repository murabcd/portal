"use server";

import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { Initiative, InitiativeExternalLink } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const createInitiativeLink = async (
  initiativeId: Initiative["id"],
  title: InitiativeExternalLink["title"],
  href: InitiativeExternalLink["href"]
): Promise<{
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

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to create links");
    }

    const now = new Date().toISOString();
    await database.insert(tables.initiativeExternalLink).values([
      {
        id: createId(),
        organizationId,
        title,
        initiativeId,
        creatorId: user.id,
        href: href.startsWith("http") ? href : `https://${href}`,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    revalidatePath(`/initiatives/${initiativeId}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
