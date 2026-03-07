import "server-only";

import type { User } from "@repo/backend/auth";
import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { Changelog } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { revalidatePath } from "next/cache";

type AddChangelogContributorProperties = {
  changelogId: Changelog["id"];
  userId: User["id"];
};

export const addChangelogContributor = async ({
  changelogId,
  userId,
}: AddChangelogContributorProperties): Promise<{
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
      throw new Error("You do not have permission to add contributors");
    }

    await database.insert(tables.changelogContributor).values([
      {
        id: createId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId,
        changelogId,
        organizationId,
      },
    ]);

    revalidatePath(`/changelog/${changelogId}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
