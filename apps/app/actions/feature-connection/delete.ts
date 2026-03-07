"use server";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { FeatureConnection } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const disconnectFeature = async (
  connectionId: FeatureConnection["id"]
): Promise<{
  error?: string;
}> => {
  const user = await currentUser();

  if (!user) {
    throw new Error("Not logged in");
  }

  if (user.organizationRole === PortalRole.Member) {
    throw new Error(
      "You don't have permission to disconnect feature connections"
    );
  }

  try {
    await database
      .delete(tables.featureConnection)
      .where(eq(tables.featureConnection.id, connectionId));

    revalidatePath("/features", "layout");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
