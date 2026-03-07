"use server";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { InitiativeExternalLink } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const deleteInitiativeLink = async (
  id: InitiativeExternalLink["id"]
): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to delete links");
    }

    const deleted = await database
      .delete(tables.initiativeExternalLink)
      .where(eq(tables.initiativeExternalLink.id, id))
      .returning({ initiativeId: tables.initiativeExternalLink.initiativeId })
      .then((rows) => rows[0]);

    if (!deleted) {
      throw new Error("Link not found");
    }

    revalidatePath(`/initiatives/${deleted.initiativeId}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
