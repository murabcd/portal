import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { Group, Initiative } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { revalidatePath } from "next/cache";

export const linkInitiativeGroup = async (
  initiativeId: Initiative["id"],
  groupId: Group["id"]
) => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to link groups");
    }

    await database.insert(tables.groupToInitiative).values([
      {
        a: groupId,
        b: initiativeId,
      },
    ]);

    revalidatePath(`/initiatives/${initiativeId}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
