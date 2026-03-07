import { database, tables } from "@repo/backend/database";
import type { FeedbackUser } from "@repo/backend/types";
import { FEEDBACK_PAGE_SIZE } from "@repo/lib/consts";
import { and, asc, eq, gt, or } from "drizzle-orm";

export type GetFeedbackUsersResponse = Pick<
  FeedbackUser,
  "createdAt" | "email" | "id" | "imageUrl" | "name"
>[];

export type FeedbackUserCursor = {
  readonly name: string;
  readonly id: string;
};

export const getFeedbackUsers = async (
  cursor?: FeedbackUserCursor | null
): Promise<
  | {
      data: GetFeedbackUsersResponse;
      nextCursor: FeedbackUserCursor | null;
    }
  | {
      error: unknown;
    }
> => {
  try {
    const cursorCondition = cursor
      ? or(
          gt(tables.feedbackUser.name, cursor.name),
          and(
            eq(tables.feedbackUser.name, cursor.name),
            gt(tables.feedbackUser.id, cursor.id)
          )
        )
      : undefined;

    const baseQuery = database
      .select({
        id: tables.feedbackUser.id,
        name: tables.feedbackUser.name,
        imageUrl: tables.feedbackUser.imageUrl,
        email: tables.feedbackUser.email,
        createdAt: tables.feedbackUser.createdAt,
      })
      .from(tables.feedbackUser)
      .orderBy(asc(tables.feedbackUser.name), asc(tables.feedbackUser.id))
      .limit(FEEDBACK_PAGE_SIZE + 1);

    const data = await (cursorCondition
      ? baseQuery.where(cursorCondition)
      : baseQuery);

    const hasNextPage = data.length > FEEDBACK_PAGE_SIZE;
    const items = hasNextPage ? data.slice(0, FEEDBACK_PAGE_SIZE) : data;
    const lastItem = items.at(-1);
    const nextCursor =
      hasNextPage && lastItem ? { name: lastItem.name, id: lastItem.id } : null;

    return { data: items, nextCursor };
  } catch (error) {
    return { error };
  }
};
