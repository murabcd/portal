import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { Changelog, ChangelogTag } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type RemoveChangelogTagProperties = {
  changelogId: Changelog["id"];
  changelogTagId: ChangelogTag["id"];
};

export const removeChangelogTag = async ({
  changelogId,
  changelogTagId,
}: RemoveChangelogTagProperties): Promise<{
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
      throw new Error("You do not have permission to remove changelog tags");
    }

    await database
      .delete(tables.changelogToChangelogTag)
      .where(
        and(
          eq(tables.changelogToChangelogTag.a, changelogId),
          eq(tables.changelogToChangelogTag.b, changelogTagId)
        )
      );

    revalidatePath(`/changelog/${changelogId}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
