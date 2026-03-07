import { database, tables } from "@repo/backend/database";
import type { FeedbackOrganization } from "@repo/backend/types";
import { FEEDBACK_PAGE_SIZE } from "@repo/lib/consts";
import { and, asc, eq, gt, or } from "drizzle-orm";

export type GetFeedbackCompaniesResponse = Pick<
  FeedbackOrganization,
  "createdAt" | "domain" | "id" | "name"
>[];

export type FeedbackOrganizationCursor = {
  readonly name: string;
  readonly id: string;
};

export const getFeedbackCompanies = async (
  cursor?: FeedbackOrganizationCursor | null
): Promise<
  | {
      data: GetFeedbackCompaniesResponse;
      nextCursor: FeedbackOrganizationCursor | null;
    }
  | {
      error: unknown;
    }
> => {
  try {
    const cursorCondition = cursor
      ? or(
          gt(tables.feedbackOrganization.name, cursor.name),
          and(
            eq(tables.feedbackOrganization.name, cursor.name),
            gt(tables.feedbackOrganization.id, cursor.id)
          )
        )
      : undefined;

    const baseQuery = database
      .select({
        id: tables.feedbackOrganization.id,
        name: tables.feedbackOrganization.name,
        domain: tables.feedbackOrganization.domain,
        createdAt: tables.feedbackOrganization.createdAt,
      })
      .from(tables.feedbackOrganization)
      .orderBy(
        asc(tables.feedbackOrganization.name),
        asc(tables.feedbackOrganization.id)
      )
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
