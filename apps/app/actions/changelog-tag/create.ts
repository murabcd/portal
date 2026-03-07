"use server";

import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { Changelog, ChangelogTag } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { revalidatePath } from "next/cache";

type CreateChangelogTagProperties = {
  changelogId: Changelog["id"];
  name: ChangelogTag["name"];
};

export const createChangelogTag = async ({
  changelogId,
  name,
}: CreateChangelogTagProperties): Promise<
  | {
      error: string;
    }
  | {
      id: ChangelogTag["id"];
    }
> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You do not have permission to create tags");
    }

    const id = createId();
    const now = new Date().toISOString();

    await database.insert(tables.changelogTag).values([
      {
        id,
        createdAt: now,
        updatedAt: now,
        name,
        organizationId,
      },
    ]);

    await database.insert(tables.changelogToChangelogTag).values([
      {
        a: changelogId,
        b: id,
      },
    ]);

    revalidatePath(`/changelog/${changelogId}`);

    return { id };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
