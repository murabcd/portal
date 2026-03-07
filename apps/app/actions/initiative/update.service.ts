import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { Initiative } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const updateInitiative = async (
  initiativeId: Initiative["id"],
  data: Partial<Initiative>
): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to update initiatives");
    }

    const now = new Date().toISOString();
    await database
      .update(tables.initiative)
      .set({ ...data, updatedAt: now })
      .where(eq(tables.initiative.id, initiativeId));

    if (data.title) {
      const page = await database
        .select({ id: tables.initiativePage.id })
        .from(tables.initiativePage)
        .where(
          and(
            eq(tables.initiativePage.initiativeId, initiativeId),
            eq(tables.initiativePage.default, true)
          )
        )
        .limit(1)
        .then((rows) => rows[0] ?? null);

      if (page) {
        await database
          .update(tables.initiativePage)
          .set({ title: data.title, updatedAt: now })
          .where(eq(tables.initiativePage.id, page.id));
      }
    }

    revalidatePath(`/initiatives/${initiativeId}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
