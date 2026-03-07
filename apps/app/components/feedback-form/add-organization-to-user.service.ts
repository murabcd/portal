import "server-only";

import { database, tables } from "@repo/backend/database";
import type { FeedbackOrganization, FeedbackUser } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type AddOrganizationToUserProperties = {
  feedbackUser: FeedbackUser["id"];
  feedbackOrganization: FeedbackOrganization["id"];
};

export const addOrganizationToUser = async ({
  feedbackUser,
  feedbackOrganization,
}: AddOrganizationToUserProperties): Promise<{
  error?: string;
}> => {
  try {
    await database
      .update(tables.feedbackUser)
      .set({
        feedbackOrganizationId: feedbackOrganization,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tables.feedbackUser.id, feedbackUser));

    revalidatePath("/feedback");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
