import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import type { InitiativePage } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { database } from "@/lib/database";

export const updateInitiativePage = async (
  pageId: InitiativePage["id"],
  data: Omit<Partial<InitiativePage>, "content"> & {
    content?: JsonValue;
  }
): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to update initiative pages");
    }

    await database
      .update(tables.initiativePage)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(tables.initiativePage.id, pageId));

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
