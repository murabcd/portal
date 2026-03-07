"use server";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { database } from "@/lib/database";

export const deleteAtlassianInstallation = async (): Promise<
  | {
      error: string;
    }
  | {
      success: true;
    }
> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error(
        "You do not have permission to delete Atlassian installations"
      );
    }

    const atlassianInstallation = await database
      .select({
        id: tables.atlassianInstallation.id,
      })
      .from(tables.atlassianInstallation)
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!atlassianInstallation) {
      throw new Error("Installation not found");
    }

    await database
      .delete(tables.atlassianInstallation)
      .where(eq(tables.atlassianInstallation.id, atlassianInstallation.id));

    return { success: true };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
