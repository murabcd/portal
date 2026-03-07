import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { FEEDBACK_PAGE_SIZE } from "@repo/lib/consts";
import { and, asc, eq, gt, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  try {
    const organizationId = await currentOrganizationId();

    if (!organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const cursorName = request.nextUrl.searchParams.get("cursorName");
    const cursorId = request.nextUrl.searchParams.get("cursorId");

    const cursorCondition =
      cursorName && cursorId
        ? or(
            gt(tables.feedbackUser.name, cursorName),
            and(
              eq(tables.feedbackUser.name, cursorName),
              gt(tables.feedbackUser.id, cursorId)
            )
          )
        : undefined;

    const conditions = [eq(tables.feedbackUser.organizationId, organizationId)];

    if (cursorCondition) {
      conditions.push(cursorCondition);
    }

    const data = await database
      .select({
        id: tables.feedbackUser.id,
        name: tables.feedbackUser.name,
        imageUrl: tables.feedbackUser.imageUrl,
        email: tables.feedbackUser.email,
        createdAt: tables.feedbackUser.createdAt,
      })
      .from(tables.feedbackUser)
      .where(and(...conditions))
      .orderBy(asc(tables.feedbackUser.name), asc(tables.feedbackUser.id))
      .limit(FEEDBACK_PAGE_SIZE + 1);

    const hasNextPage = data.length > FEEDBACK_PAGE_SIZE;
    const items = hasNextPage ? data.slice(0, FEEDBACK_PAGE_SIZE) : data;
    const lastItem = items.at(-1);
    const nextCursor =
      hasNextPage && lastItem ? { name: lastItem.name, id: lastItem.id } : null;

    return NextResponse.json({ data: items, nextCursor });
  } catch {
    return new NextResponse("Failed to load users", { status: 500 });
  }
};
