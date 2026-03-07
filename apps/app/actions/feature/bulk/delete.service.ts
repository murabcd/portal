import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { Feature } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const deleteFeatures = async (
  ids: Feature["id"][]
): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You do not have permission to delete features");
    }

    if (ids.length > 0) {
      await database
        .delete(tables.feature)
        .where(inArray(tables.feature.id, ids));
    }

    revalidatePath("/features");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
