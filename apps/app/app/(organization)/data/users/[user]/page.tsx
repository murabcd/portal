import { currentOrganizationId } from "@repo/backend/auth/utils";
import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import { Separator } from "@repo/design-system/components/ui/separator";
import { cn } from "@repo/design-system/lib/utils";
import { contentToText } from "@repo/editor/lib/tiptap";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FeedbackItem } from "@/app/(organization)/feedback/components/feedback-item";
import { createMetadata } from "@/lib/metadata";

type FeedbackUserPageProperties = {
  readonly params: Promise<{
    user: string;
  }>;
};

export const generateMetadata = async (
  props: FeedbackUserPageProperties
): Promise<Metadata> => {
  const params = await props.params;
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return {};
  }

  const user = await database
    .select({
      name: tables.feedbackUser.name,
      email: tables.feedbackUser.email,
    })
    .from(tables.feedbackUser)
    .where(
      and(
        eq(tables.feedbackUser.id, params.user),
        eq(tables.feedbackUser.organizationId, organizationId)
      )
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!user) {
    return {};
  }

  return createMetadata({
    title: user.name,
    description: user.email,
  });
};

const FeedbackUserPage = async (props: FeedbackUserPageProperties) => {
  const params = await props.params;
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    notFound();
  }

  const [user, feedback] = await Promise.all([
    database
      .select({
        id: tables.feedbackUser.id,
        name: tables.feedbackUser.name,
        email: tables.feedbackUser.email,
        imageUrl: tables.feedbackUser.imageUrl,
      })
      .from(tables.feedbackUser)
      .where(
        and(
          eq(tables.feedbackUser.id, params.user),
          eq(tables.feedbackUser.organizationId, organizationId)
        )
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
    database
      .select({
        id: tables.feedback.id,
        title: tables.feedback.title,
        createdAt: tables.feedback.createdAt,
        aiSentiment: tables.feedback.aiSentiment,
        feedbackUserName: tables.feedbackUser.name,
        feedbackUserEmail: tables.feedbackUser.email,
        feedbackUserImageUrl: tables.feedbackUser.imageUrl,
      })
      .from(tables.feedback)
      .innerJoin(
        tables.feedbackUser,
        eq(tables.feedbackUser.id, tables.feedback.feedbackUserId)
      )
      .where(
        and(
          eq(tables.feedback.feedbackUserId, params.user),
          eq(tables.feedback.organizationId, organizationId)
        )
      ),
  ]);

  if (!user) {
    notFound();
  }

  const promises = feedback.map(async (feedbackItem) => {
    const content = await getJsonColumnFromTable(
      "feedback",
      "content",
      feedbackItem.id
    );

    return {
      id: feedbackItem.id,
      title: feedbackItem.title,
      createdAt: feedbackItem.createdAt,
      aiSentiment: feedbackItem.aiSentiment,
      feedbackUser: {
        name: feedbackItem.feedbackUserName ?? "",
        email: feedbackItem.feedbackUserEmail ?? "",
        imageUrl: feedbackItem.feedbackUserImageUrl ?? "",
      },
      text: content ? contentToText(content) : "No description provided.",
    };
  });

  const modifiedFeedback = await Promise.all(promises);

  return (
    <div className="w-full px-6 py-16">
      <div className="mx-auto grid w-full max-w-prose gap-6">
        <Image
          alt={user.name}
          className="m-0 h-24 w-24 rounded-full object-fill"
          height={96}
          src={user.imageUrl}
          width={96}
        />

        <div className="grid gap-2">
          <h2
            className={cn(
              "resize-none border-none bg-transparent p-0 font-semibold text-4xl tracking-tight shadow-none outline-none",
              "text-foreground"
            )}
          >
            {user.name}
          </h2>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        <Separator />

        <div className="grid gap-2">
          <h2 className="font-semibold text-lg">Feedback</h2>
          <Suspense fallback={null}>
            <div className="grid gap-1">
              {modifiedFeedback.map((feedbackItem) => (
                <div
                  className="overflow-hidden rounded-md border bg-background"
                  key={feedbackItem.id}
                >
                  <FeedbackItem feedback={feedbackItem} />
                </div>
              ))}
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default FeedbackUserPage;
