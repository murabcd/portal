import { currentOrganizationId } from "@repo/backend/auth/utils";
import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import { contentToText } from "@repo/editor/lib/tiptap";
import { FEEDBACK_PAGE_SIZE } from "@repo/lib/consts";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  try {
    const organizationId = await currentOrganizationId();

    if (!organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const cursorPublishAt =
      request.nextUrl.searchParams.get("cursorPublishAt") ?? undefined;
    const cursorId = request.nextUrl.searchParams.get("cursorId") ?? undefined;
    const cursorCondition =
      cursorPublishAt && cursorId
        ? or(
            lt(tables.changelog.publishAt, cursorPublishAt),
            and(
              eq(tables.changelog.publishAt, cursorPublishAt),
              lt(tables.changelog.id, cursorId)
            )
          )
        : undefined;

    const changelogs = await database
      .select({
        id: tables.changelog.id,
        title: tables.changelog.title,
        publishAt: tables.changelog.publishAt,
        status: tables.changelog.status,
      })
      .from(tables.changelog)
      .where(
        cursorCondition
          ? and(
              eq(tables.changelog.organizationId, organizationId),
              cursorCondition
            )
          : eq(tables.changelog.organizationId, organizationId)
      )
      .orderBy(desc(tables.changelog.publishAt), desc(tables.changelog.id))
      .limit(FEEDBACK_PAGE_SIZE + 1);

    const hasNextPage = changelogs.length > FEEDBACK_PAGE_SIZE;
    const items = hasNextPage
      ? changelogs.slice(0, FEEDBACK_PAGE_SIZE)
      : changelogs;
    const lastItem = items.at(-1);
    const nextCursor =
      hasNextPage && lastItem
        ? { publishAt: lastItem.publishAt, id: lastItem.id }
        : null;

    const data = await Promise.all(
      items.map(async (changelog) => {
        const content = await getJsonColumnFromTable(
          "changelog",
          "content",
          changelog.id
        );

        return {
          ...changelog,
          text: content ? contentToText(content) : "No description provided.",
        };
      })
    );

    return NextResponse.json({ data, nextCursor });
  } catch {
    return new NextResponse("Failed to load changelog", { status: 500 });
  }
};
