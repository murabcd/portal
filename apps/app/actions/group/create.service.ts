import "server-only";

import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { Group } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

type CreateGroupProperties = {
  name: Group["name"];
  productId: string | undefined;
  parentGroupId: string | undefined;
};

export const createGroup = async ({
  name,
  productId,
  parentGroupId,
}: CreateGroupProperties): Promise<{
  id?: Group["id"];
  error?: string;
}> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("You must be logged in to create a group.");
    }

    if (!user.email) {
      throw new Error("You must have an email to create a group.");
    }

    if (!user.emailVerified) {
      throw new Error("You must have a verified email to create a group.");
    }

    const id = createId();
    const now = new Date().toISOString();
    await database.insert(tables.group).values([
      {
        id,
        name,
        creatorId: user.id,
        organizationId,
        productId,
        parentGroupId,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    revalidatePath("/features");

    return { id };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
