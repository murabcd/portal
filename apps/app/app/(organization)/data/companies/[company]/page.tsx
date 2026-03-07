import { currentOrganizationId } from "@repo/backend/auth/utils";
import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import { Separator } from "@repo/design-system/components/ui/separator";
import { contentToText } from "@repo/editor/lib/tiptap";
import { createMetadata } from "@repo/lib/metadata";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CompanyLogo } from "@/app/(organization)/components/company-logo";
import { FeedbackItem } from "@/app/(organization)/feedback/components/feedback-item";

type FeedbackCompanyPageProperties = {
  readonly params: Promise<{
    company: string;
  }>;
};

export const generateMetadata = async (
  props: FeedbackCompanyPageProperties
): Promise<Metadata> => {
  const params = await props.params;
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return {};
  }

  const company = await database
    .select({
      name: tables.feedbackOrganization.name,
      domain: tables.feedbackOrganization.domain,
    })
    .from(tables.feedbackOrganization)
    .where(
      and(
        eq(tables.feedbackOrganization.id, params.company),
        eq(tables.feedbackOrganization.organizationId, organizationId)
      )
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!company) {
    return {};
  }

  return createMetadata({
    title: company.name,
    description: company.domain ?? "",
  });
};

const FeedbackCompanyPage = async (props: FeedbackCompanyPageProperties) => {
  const params = await props.params;
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    notFound();
  }

  const [company, feedback] = await Promise.all([
    database
      .select({
        name: tables.feedbackOrganization.name,
        domain: tables.feedbackOrganization.domain,
      })
      .from(tables.feedbackOrganization)
      .where(
        and(
          eq(tables.feedbackOrganization.id, params.company),
          eq(tables.feedbackOrganization.organizationId, organizationId)
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
          eq(tables.feedbackUser.feedbackOrganizationId, params.company),
          eq(tables.feedback.organizationId, organizationId)
        )
      ),
  ]);

  if (!company) {
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
        <CompanyLogo
          className="m-0 rounded-full"
          fallback={company.name.slice(0, 2)}
          size={96}
          src={company.domain}
        />

        <div className="grid gap-2">
          <h2 className="resize-none border-none bg-transparent p-0 font-semibold text-4xl text-foreground tracking-tight shadow-none outline-none">
            {company.name}
          </h2>
          <p className="text-muted-foreground">{company.domain}</p>
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

export default FeedbackCompanyPage;
