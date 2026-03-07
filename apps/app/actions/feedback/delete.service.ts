import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { Feedback } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const deleteFeedback = async (
  feedbackId: Feedback["id"]
): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to delete feedback");
    }

    await database
      .delete(tables.feedback)
      .where(eq(tables.feedback.id, feedbackId));

    revalidatePath("/feedback");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
