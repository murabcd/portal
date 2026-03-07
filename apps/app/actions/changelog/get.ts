import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import type { Changelog } from "@repo/backend/types";
import { contentToText } from "@repo/editor/lib/tiptap";
import { FEEDBACK_PAGE_SIZE } from "@repo/lib/consts";
import { and, desc, eq, lt, or } from "drizzle-orm";

export type GetChangelogResponse = (Pick<
  Changelog,
  "id" | "publishAt" | "status" | "title"
> & {
  text: string;
})[];

export const getChangelog = async (
  cursor?: { publishAt: string; id: string } | null
): Promise<
  | {
      data: GetChangelogResponse;
      nextCursor: { publishAt: string; id: string } | null;
    }
  | {
      error: unknown;
    }
> => {
  try {
    const cursorCondition = cursor
      ? or(
          lt(tables.changelog.publishAt, cursor.publishAt),
          and(
            eq(tables.changelog.publishAt, cursor.publishAt),
            lt(tables.changelog.id, cursor.id)
          )
        )
      : undefined;

    const baseQuery = database
      .select({
        id: tables.changelog.id,
        title: tables.changelog.title,
        publishAt: tables.changelog.publishAt,
        status: tables.changelog.status,
      })
      .from(tables.changelog)
      .orderBy(desc(tables.changelog.publishAt), desc(tables.changelog.id))
      .limit(FEEDBACK_PAGE_SIZE + 1);

    const changelogs = await (cursorCondition
      ? baseQuery.where(cursorCondition)
      : baseQuery);

    const hasNextPage = changelogs.length > FEEDBACK_PAGE_SIZE;
    const items = hasNextPage
      ? changelogs.slice(0, FEEDBACK_PAGE_SIZE)
      : changelogs;
    const lastItem = items.at(-1);
    const nextCursor =
      hasNextPage && lastItem
        ? { publishAt: lastItem.publishAt, id: lastItem.id }
        : null;

    const modifiedData = items.map(async (changelog) => {
      const content = await getJsonColumnFromTable(
        "changelog",
        "content",
        changelog.id
      );

      return {
        ...changelog,
        text: content ? contentToText(content) : "No description provided.",
      };
    });

    const data = await Promise.all(modifiedData);

    return { data, nextCursor };
  } catch (error) {
    return { error };
  }
};
