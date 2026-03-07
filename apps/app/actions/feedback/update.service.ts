import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import type { Feedback } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const updateFeedback = async (
  feedbackId: Feedback["id"],
  data: Omit<Partial<Feedback>, "content" | "transcript"> & {
    content?: JsonValue;
  }
): Promise<
  | {
      error: string;
    }
  | {
      id: Feedback["id"] | undefined;
    }
> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to update feedback");
    }

    // If we're updating the content, we need to reset the feedback analysis data
    const updateData: Partial<typeof tables.feedback.$inferInsert> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if ("content" in data) {
      updateData.processed = false;
      updateData.aiSentiment = null;
      updateData.aiSentimentReason = null;

      await database
        .delete(tables.feedbackAnalysis)
        .where(eq(tables.feedbackAnalysis.feedbackId, feedbackId));
    }

    await database
      .update(tables.feedback)
      .set(updateData)
      .where(eq(tables.feedback.id, feedbackId));

    revalidatePath(`/feedback/${feedbackId}`);

    const nextFeedback = await database
      .select({ id: tables.feedback.id })
      .from(tables.feedback)
      .where(eq(tables.feedback.processed, false))
      .orderBy(desc(tables.feedback.createdAt))
      .limit(1)
      .then((rows) => rows[0] ?? null);
    return { id: nextFeedback?.id };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
