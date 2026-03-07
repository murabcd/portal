import "server-only";

import type { User } from "@repo/backend/auth";
import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { Initiative } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type DeleteInitiativeMemberProperties = {
  initiativeId: Initiative["id"];
  userId: User["id"];
};

export const deleteInitiativeMember = async ({
  initiativeId,
  userId,
}: DeleteInitiativeMemberProperties): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to delete members");
    }

    const initiativeMember = await database
      .select({ id: tables.initiativeMember.id })
      .from(tables.initiativeMember)
      .where(
        and(
          eq(tables.initiativeMember.userId, userId),
          eq(tables.initiativeMember.initiativeId, initiativeId)
        )
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!initiativeMember) {
      throw new Error("Initiative member not found");
    }

    await database
      .delete(tables.initiativeMember)
      .where(eq(tables.initiativeMember.id, initiativeMember.id));

    revalidatePath(`/initiatives/${initiativeId}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
