import "server-only";

import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import { createId } from "@repo/backend/id";
import type { Feedback } from "@repo/backend/types";
import { textToContent } from "@repo/editor/lib/tiptap";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

type CreateFeedbackProperties = {
  title: Feedback["title"];
  feedbackUserId: Feedback["feedbackUserId"];
  content?: JsonValue;
  audioUrl?: Feedback["audioUrl"];
  videoUrl?: Feedback["videoUrl"];
};

export const createFeedback = async ({
  title,
  content,
  feedbackUserId,
  audioUrl,
  videoUrl,
}: CreateFeedbackProperties): Promise<{
  id?: Feedback["id"];
  error?: string;
}> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("You must be logged in to create feedback.");
    }

    const organization = await database
      .select({ id: tables.organization.id })
      .from(tables.organization)
      .where(eq(tables.organization.id, organizationId))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!organization) {
      throw new Error("Organization not found");
    }

    const id = createId();
    const now = new Date().toISOString();

    await database.insert(tables.feedback).values([
      {
        id,
        title,
        content: content ?? (textToContent("") as JsonValue),
        organizationId,
        feedbackUserId,
        audioUrl,
        videoUrl,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    revalidatePath("/feedback", "layout");

    return { id };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
