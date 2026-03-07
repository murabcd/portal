import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { Changelog, ChangelogTag } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { revalidatePath } from "next/cache";

type AddChangelogTagProperties = {
  changelogId: Changelog["id"];
  changelogTagId: ChangelogTag["id"];
};

export const addChangelogTag = async ({
  changelogId,
  changelogTagId,
}: AddChangelogTagProperties): Promise<{
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
      throw new Error("You do not have permission to add tags");
    }

    await database.insert(tables.changelogToChangelogTag).values([
      {
        a: changelogId,
        b: changelogTagId,
      },
    ]);

    revalidatePath(`/changelog/${changelogId}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
