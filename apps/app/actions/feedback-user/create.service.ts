import "server-only";

import { currentOrganizationId } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { FeedbackUser } from "@repo/backend/types";
import { getGravatarUrl } from "@repo/lib/gravatar";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { friendlyWords } from "friendlier-words";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

type CreateFeedbackUserProperties = {
  name?: FeedbackUser["name"];
  email: FeedbackUser["email"];
};

export const createFeedbackUser = async ({
  name = friendlyWords(2, " "),
  email,
}: CreateFeedbackUserProperties): Promise<{
  id?: FeedbackUser["id"];
  error?: string;
}> => {
  try {
    const organizationId = await currentOrganizationId();

    if (!organizationId) {
      throw new Error("Not logged in");
    }

    const existingUser = await database
      .select({ id: tables.feedbackUser.id })
      .from(tables.feedbackUser)
      .where(eq(tables.feedbackUser.email, email))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (existingUser) {
      return { id: existingUser.id };
    }

    const id = createId();
    const now = new Date().toISOString();
    await database.insert(tables.feedbackUser).values([
      {
        id,
        name,
        email,
        organizationId,
        imageUrl: await getGravatarUrl(email),
        createdAt: now,
        updatedAt: now,
      },
    ]);

    revalidatePath("/", "layout");

    return { id };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
