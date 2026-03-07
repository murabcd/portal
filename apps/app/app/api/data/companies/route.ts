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
            gt(tables.feedbackOrganization.name, cursorName),
            and(
              eq(tables.feedbackOrganization.name, cursorName),
              gt(tables.feedbackOrganization.id, cursorId)
            )
          )
        : undefined;

    const conditions = [
      eq(tables.feedbackOrganization.organizationId, organizationId),
    ];

    if (cursorCondition) {
      conditions.push(cursorCondition);
    }

    const data = await database
      .select({
        id: tables.feedbackOrganization.id,
        name: tables.feedbackOrganization.name,
        domain: tables.feedbackOrganization.domain,
        createdAt: tables.feedbackOrganization.createdAt,
      })
      .from(tables.feedbackOrganization)
      .where(and(...conditions))
      .orderBy(
        asc(tables.feedbackOrganization.name),
        asc(tables.feedbackOrganization.id)
      )
      .limit(FEEDBACK_PAGE_SIZE + 1);

    const hasNextPage = data.length > FEEDBACK_PAGE_SIZE;
    const items = hasNextPage ? data.slice(0, FEEDBACK_PAGE_SIZE) : data;
    const lastItem = items.at(-1);
    const nextCursor =
      hasNextPage && lastItem ? { name: lastItem.name, id: lastItem.id } : null;

    return NextResponse.json({ data: items, nextCursor });
  } catch {
    return new NextResponse("Failed to load companies", { status: 500 });
  }
};
