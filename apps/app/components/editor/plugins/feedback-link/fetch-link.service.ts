import "server-only";

import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import type { Feedback, FeedbackUser } from "@repo/backend/types";
import { contentToText } from "@repo/editor/lib/tiptap";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";

export type FetchLinkResponse = Pick<
  Feedback,
  "aiSentiment" | "createdAt" | "id" | "title"
> & {
  readonly text: string;
  readonly feedbackUser: Pick<
    FeedbackUser,
    "email" | "imageUrl" | "name"
  > | null;
};

export const fetchLink = async (
  id: Feedback["id"]
): Promise<{
  error?: string;
  data?: FetchLinkResponse;
}> => {
  try {
    const feedback = await database
      .select({
        id: tables.feedback.id,
        title: tables.feedback.title,
        createdAt: tables.feedback.createdAt,
        aiSentiment: tables.feedback.aiSentiment,
        feedbackUserId: tables.feedback.feedbackUserId,
        feedbackUserName: tables.feedbackUser.name,
        feedbackUserEmail: tables.feedbackUser.email,
        feedbackUserImageUrl: tables.feedbackUser.imageUrl,
      })
      .from(tables.feedback)
      .leftJoin(
        tables.feedbackUser,
        eq(tables.feedbackUser.id, tables.feedback.feedbackUserId)
      )
      .where(eq(tables.feedback.id, id))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!feedback) {
      throw new Error("Feedback not found");
    }

    const content = await getJsonColumnFromTable(
      "feedback",
      "content",
      feedback.id
    );

    const data: FetchLinkResponse = {
      id: feedback.id,
      title: feedback.title,
      createdAt: feedback.createdAt,
      aiSentiment: feedback.aiSentiment,
      feedbackUser: feedback.feedbackUserId
        ? {
            name: feedback.feedbackUserName ?? "",
            email: feedback.feedbackUserEmail ?? "",
            imageUrl: feedback.feedbackUserImageUrl ?? "",
          }
        : null,
      text: content ? contentToText(content) : "",
    };

    return { data };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
