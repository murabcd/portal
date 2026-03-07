import { database, tables } from "@repo/backend/database";
import type { Feedback, FeedbackUser } from "@repo/backend/types";
import { contentToText } from "@repo/editor/lib/tiptap";
import { FEEDBACK_PAGE_SIZE } from "@repo/lib/consts";
import { and, desc, eq, lt, or, type SQL } from "drizzle-orm";

export type GetFeedbackResponse = (Pick<
  Feedback,
  "aiSentiment" | "createdAt" | "id" | "title"
> & {
  readonly text: string;
  readonly feedbackUser: Pick<
    FeedbackUser,
    "email" | "imageUrl" | "name"
  > | null;
})[];

export type FeedbackCursor = {
  readonly createdAt: string;
  readonly id: string;
};

export const getFeedback = async (
  showProcessed: boolean,
  cursor?: FeedbackCursor | null
): Promise<
  | {
      data: GetFeedbackResponse;
      nextCursor: FeedbackCursor | null;
    }
  | {
      error: unknown;
    }
> => {
  try {
    const cursorCondition = cursor
      ? or(
          lt(tables.feedback.createdAt, cursor.createdAt),
          and(
            eq(tables.feedback.createdAt, cursor.createdAt),
            lt(tables.feedback.id, cursor.id)
          )
        )
      : undefined;
    const processedCondition = showProcessed
      ? undefined
      : eq(tables.feedback.processed, false);
    const conditions: SQL<unknown>[] = [];
    if (processedCondition) {
      conditions.push(processedCondition);
    }
    if (cursorCondition) {
      conditions.push(cursorCondition);
    }

    const baseQuery = database
      .select({
        id: tables.feedback.id,
        title: tables.feedback.title,
        createdAt: tables.feedback.createdAt,
        audioUrl: tables.feedback.audioUrl,
        videoUrl: tables.feedback.videoUrl,
        aiSentiment: tables.feedback.aiSentiment,
        content: tables.feedback.content,
        feedbackUserName: tables.feedbackUser.name,
        feedbackUserEmail: tables.feedbackUser.email,
        feedbackUserImageUrl: tables.feedbackUser.imageUrl,
      })
      .from(tables.feedback)
      .leftJoin(
        tables.feedbackUser,
        eq(tables.feedbackUser.id, tables.feedback.feedbackUserId)
      )
      .orderBy(desc(tables.feedback.createdAt), desc(tables.feedback.id))
      .limit(FEEDBACK_PAGE_SIZE + 1);

    const feedbacks = await (conditions.length
      ? baseQuery.where(and(...conditions))
      : baseQuery);

    const hasNextPage = feedbacks.length > FEEDBACK_PAGE_SIZE;
    const items = hasNextPage
      ? feedbacks.slice(0, FEEDBACK_PAGE_SIZE)
      : feedbacks;
    const lastItem = items.at(-1);
    const nextCursor =
      hasNextPage && lastItem
        ? { createdAt: lastItem.createdAt, id: lastItem.id }
        : null;

    const data = items.map(({ audioUrl, videoUrl, content, ...feedback }) => {
      let text = content ? contentToText(content) : "No content.";

      if (audioUrl) {
        text = "Audio feedback";
      } else if (videoUrl) {
        text = "Video feedback";
      }

      return {
        id: feedback.id,
        title: feedback.title,
        createdAt: feedback.createdAt,
        aiSentiment: feedback.aiSentiment,
        feedbackUser:
          feedback.feedbackUserEmail || feedback.feedbackUserName
            ? {
                name: feedback.feedbackUserName ?? "",
                email: feedback.feedbackUserEmail ?? "",
                imageUrl: feedback.feedbackUserImageUrl ?? "",
              }
            : null,
        text,
      };
    });

    return { data, nextCursor };
  } catch (error) {
    return { error };
  }
};
