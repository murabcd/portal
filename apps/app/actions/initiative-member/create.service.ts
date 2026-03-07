import "server-only";

import type { User } from "@repo/backend/auth";
import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { Initiative } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { revalidatePath } from "next/cache";

type AddInitiativeMemberProperties = {
  initiativeId: Initiative["id"];
  userId: User["id"];
};

export const addInitiativeMember = async ({
  initiativeId,
  userId,
}: AddInitiativeMemberProperties): Promise<{
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
      throw new Error("You don't have permission to add members");
    }

    await database.insert(tables.initiativeMember).values([
      {
        id: createId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId,
        initiativeId,
        organizationId,
        creatorId: user.id,
      },
    ]);

    revalidatePath(`/initiatives/${initiativeId}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
