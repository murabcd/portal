import "server-only";

import type { User } from "@repo/backend/auth";
import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { Changelog } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type DeleteChangelogContributorProperties = {
  changelogId: Changelog["id"];
  userId: User["id"];
};

export const deleteChangelogContributor = async ({
  changelogId,
  userId,
}: DeleteChangelogContributorProperties): Promise<{
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
      throw new Error("You do not have permission to delete contributors");
    }

    const changelogContributor = await database
      .select({ id: tables.changelogContributor.id })
      .from(tables.changelogContributor)
      .where(
        and(
          eq(tables.changelogContributor.userId, userId),
          eq(tables.changelogContributor.changelogId, changelogId)
        )
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!changelogContributor) {
      throw new Error("Changelog contributor not found");
    }

    await database
      .delete(tables.changelogContributor)
      .where(eq(tables.changelogContributor.id, changelogContributor.id));

    revalidatePath(`/changelog/${changelogId}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
