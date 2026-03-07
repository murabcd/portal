import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { InitiativeFile } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const deleteInitiativeFile = async (
  id: InitiativeFile["id"]
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
      .delete(tables.initiativeFile)
      .where(eq(tables.initiativeFile.id, id))
      .returning({ initiativeId: tables.initiativeFile.initiativeId });

    const initiativeId = deleted[0]?.initiativeId;

    if (!initiativeId) {
      throw new Error("Initiative file not found");
    }

    revalidatePath(`/initiatives/${initiativeId}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
