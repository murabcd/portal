import "server-only";

import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { ApiKey } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";

export const createAPIKey = async (
  name: ApiKey["name"]
): Promise<{
  error?: string;
  key?: ApiKey["key"];
}> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("User or organization not found");
    }

    const key = createId();

    await database.insert(tables.apiKey).values([
      {
        id: createId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name,
        key,
        creatorId: user.id,
        organizationId,
      },
    ]);

    return { key };
  } catch (error) {
    const message = parseError(error);

    return {
      error: message,
    };
  }
};
