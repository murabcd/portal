import "server-only";

import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { Initiative, InitiativeFile } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { revalidatePath } from "next/cache";

type CreateInitiativeFileProperties = {
  initiativeId: Initiative["id"];
  data: {
    name: string;
    url: string;
  };
};

export const createInitiativeFile = async ({
  initiativeId,
  data,
}: CreateInitiativeFileProperties): Promise<{
  id?: InitiativeFile["id"];
  error?: string;
}> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("You must be logged in to create a file.");
    }

    const id = createId();

    await database.insert(tables.initiativeFile).values([
      {
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: data.name,
        url: data.url,
        creatorId: user.id,
        organizationId,
        initiativeId,
      },
    ]);

    revalidatePath(`/initiatives/${initiativeId}`);

    return { id };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
