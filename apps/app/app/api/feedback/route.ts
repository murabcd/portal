import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { contentToText } from "@repo/editor/lib/tiptap";
import { FEEDBACK_PAGE_SIZE } from "@repo/lib/consts";
import { and, desc, eq, lt, or, type SQL, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

type FeedbackCursor = {
  readonly createdAt: string;
  readonly id: string;
};

export const GET = async (request: NextRequest) => {
  try {
    const organizationId = await currentOrganizationId();

    if (!organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const showProcessed =
      request.nextUrl.searchParams.get("showProcessed") === "true";
    const cursorCreatedAt = request.nextUrl.searchParams.get("cursorCreatedAt");
    const cursorId = request.nextUrl.searchParams.get("cursorId");
    const cursor =
      cursorCreatedAt && cursorId
        ? ({
            createdAt: cursorCreatedAt,
            id: cursorId,
          } satisfies FeedbackCursor)
        : null;

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
    const conditions: SQL<unknown>[] = [
      eq(tables.feedback.organizationId, organizationId),
    ];

    if (processedCondition) {
      conditions.push(processedCondition);
    }

    if (cursorCondition) {
      conditions.push(cursorCondition);
    }

    const [totalCount, feedbacks] = await Promise.all([
      database
        .select({ count: sql<number>`count(*)` })
        .from(tables.feedback)
        .where(eq(tables.feedback.organizationId, organizationId))
        .then((rows) => rows[0]?.count ?? 0),
      database
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
        .where(and(...conditions))
        .orderBy(desc(tables.feedback.createdAt), desc(tables.feedback.id))
        .limit(FEEDBACK_PAGE_SIZE + 1),
    ]);

    const hasNextPage = feedbacks.length > FEEDBACK_PAGE_SIZE;
    const items = hasNextPage
      ? feedbacks.slice(0, FEEDBACK_PAGE_SIZE)
      : feedbacks;
    const lastItem = items.at(-1);
    const nextCursor =
      hasNextPage && lastItem
        ? { createdAt: lastItem.createdAt, id: lastItem.id }
        : null;

    return NextResponse.json({
      data: items.map(({ audioUrl, videoUrl, content, ...feedback }) => {
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
      }),
      nextCursor,
      totalCount,
    });
  } catch {
    return new NextResponse("Failed to load feedback", { status: 500 });
  }
};
