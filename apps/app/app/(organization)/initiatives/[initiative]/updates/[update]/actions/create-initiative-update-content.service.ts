import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import type { Initiative, InitiativeUpdate } from "@repo/backend/types";
import { textToContent } from "@repo/editor/lib/tiptap";
import { parseError } from "@repo/lib/parse-error";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const createInitiativeUpdateContent = async (
  initiativeId: Initiative["id"],
  initiativeUpdateId: InitiativeUpdate["id"]
): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You do not have permission to create update versions");
    }

    const [update] = await database
      .update(tables.initiativeUpdate)
      .set({
        content: textToContent("") as JsonValue,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(tables.initiativeUpdate.id, initiativeUpdateId),
          eq(tables.initiativeUpdate.initiativeId, initiativeId)
        )
      )
      .returning({
        id: tables.initiativeUpdate.id,
        initiativeId: tables.initiativeUpdate.initiativeId,
      });

    if (!update) {
      throw new Error("Update not found");
    }

    revalidatePath(`/initiative/${update.initiativeId}/updates/${update.id}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
