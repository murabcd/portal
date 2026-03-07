import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { ApiKey } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const deleteAPIKey = async (
  id: ApiKey["id"]
): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You do not have permission to delete API keys");
    }

    await database.delete(tables.apiKey).where(eq(tables.apiKey.id, id));

    revalidatePath("/settings/api");

    return {};
  } catch (error) {
    const message = parseError(error);

    return {
      error: message,
    };
  }
};
