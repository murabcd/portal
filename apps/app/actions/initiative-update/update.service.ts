import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import type { InitiativeUpdate } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const updateInitiativeUpdate = async (
  initiativeUpdateId: InitiativeUpdate["id"],
  data: Omit<Partial<InitiativeUpdate>, "content"> & {
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
      throw new Error(
        "You do not have permission to update initiative updates"
      );
    }

    const [initiativeUpdate] = await database
      .update(tables.initiativeUpdate)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(tables.initiativeUpdate.id, initiativeUpdateId))
      .returning({
        id: tables.initiativeUpdate.id,
        initiativeId: tables.initiativeUpdate.initiativeId,
      });

    if (!initiativeUpdate) {
      throw new Error("Update not found");
    }

    revalidatePath(
      `/initiative/${initiativeUpdate.initiativeId}/updates/${initiativeUpdateId}`
    );

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
