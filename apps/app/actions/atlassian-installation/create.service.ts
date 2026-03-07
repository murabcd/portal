import "server-only";

import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import { parseError } from "@repo/lib/src/parse-error";
import { database } from "@/lib/database";

type CreateAtlassianInstallationProperties = {
  accessToken: string;
  email: string;
  siteUrl: string;
};

export const createAtlassianInstallation = async ({
  accessToken,
  email,
  siteUrl,
}: CreateAtlassianInstallationProperties): Promise<
  | {
      error: string;
    }
  | {
      success: true;
    }
> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("Unauthorized");
    }

    const now = new Date().toISOString();
    await database.insert(tables.atlassianInstallation).values([
      {
        id: createId(),
        organizationId,
        creatorId: user.id,
        accessToken,
        email,
        siteUrl,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    return {
      success: true,
    };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
