import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { Feedback } from "@repo/backend/types";
import { Link } from "@repo/design-system/components/link";
import { Avatar } from "@repo/design-system/components/precomposed/avatar";
import { Prose } from "@repo/design-system/components/prose";
import { SentimentEmoji } from "@repo/design-system/components/sentiment-emoji";
import { StackCard } from "@repo/design-system/components/stack-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/design-system/components/ui/accordion";
import { formatDate } from "@repo/lib/format";
import { and, eq } from "drizzle-orm";
import { SparklesIcon } from "lucide-react";
import Markdown from "react-markdown";
import { CompanyLogo } from "@/app/(organization)/components/company-logo";
import { FeedbackSettingsDropdown } from "./feedback-settings-dropdown";
import { ProcessFeedbackButton } from "./process-feedback-button";

type FeedbackPanelProps = {
  feedbackId: Feedback["id"];
};

const sentimentLabelRegex = /^\w/u;

const formatSentimentLabel = (sentiment: string) =>
  sentiment
    .toLowerCase()
    .replace(sentimentLabelRegex, (char) => char.toUpperCase());

const buildFeedback = (feedbackRow: {
  id: string;
  createdAt: string;
  processed: boolean;
  aiSentiment: string | null;
  aiSentimentReason: string | null;
  analysisSummary: string | null;
  analysisOutcomes: string | null;
  analysisPainPoints: string | null;
  analysisRecommendations: string | null;
  feedbackUserId: string | null;
  feedbackUserName: string | null;
  feedbackUserImageUrl: string | null;
  feedbackOrganizationId: string | null;
  feedbackOrganizationName: string | null;
  feedbackOrganizationDomain: string | null;
}) => ({
  id: feedbackRow.id,
  createdAt: feedbackRow.createdAt,
  processed: feedbackRow.processed,
  aiSentiment: feedbackRow.aiSentiment,
  aiSentimentReason: feedbackRow.aiSentimentReason,
  analysis:
    feedbackRow.analysisSummary ||
    feedbackRow.analysisOutcomes ||
    feedbackRow.analysisPainPoints ||
    feedbackRow.analysisRecommendations
      ? {
          summary: feedbackRow.analysisSummary ?? null,
          outcomes: feedbackRow.analysisOutcomes ?? null,
          painPoints: feedbackRow.analysisPainPoints ?? null,
          recommendations: feedbackRow.analysisRecommendations ?? null,
        }
      : null,
  feedbackUser: feedbackRow.feedbackUserId
    ? {
        id: feedbackRow.feedbackUserId,
        name: feedbackRow.feedbackUserName ?? "",
        imageUrl: feedbackRow.feedbackUserImageUrl ?? "",
        feedbackOrganization: feedbackRow.feedbackOrganizationId
          ? {
              id: feedbackRow.feedbackOrganizationId,
              name: feedbackRow.feedbackOrganizationName ?? "",
              domain: feedbackRow.feedbackOrganizationDomain ?? "",
            }
          : null,
      }
    : null,
});

const loadFeedbackPanelData = async (feedbackId: Feedback["id"]) => {
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    return null;
  }

  const [feedbackRow, feedbackUsers, feedbackOrganizations] = await Promise.all(
    [
      database
        .select({
          id: tables.feedback.id,
          createdAt: tables.feedback.createdAt,
          processed: tables.feedback.processed,
          aiSentiment: tables.feedback.aiSentiment,
          aiSentimentReason: tables.feedback.aiSentimentReason,
          analysisSummary: tables.feedbackAnalysis.summary,
          analysisOutcomes: tables.feedbackAnalysis.outcomes,
          analysisPainPoints: tables.feedbackAnalysis.painPoints,
          analysisRecommendations: tables.feedbackAnalysis.recommendations,
          feedbackUserId: tables.feedbackUser.id,
          feedbackUserName: tables.feedbackUser.name,
          feedbackUserImageUrl: tables.feedbackUser.imageUrl,
          feedbackOrganizationId: tables.feedbackOrganization.id,
          feedbackOrganizationName: tables.feedbackOrganization.name,
          feedbackOrganizationDomain: tables.feedbackOrganization.domain,
        })
        .from(tables.feedback)
        .leftJoin(
          tables.feedbackUser,
          eq(tables.feedbackUser.id, tables.feedback.feedbackUserId)
        )
        .leftJoin(
          tables.feedbackAnalysis,
          eq(tables.feedbackAnalysis.feedbackId, tables.feedback.id)
        )
        .leftJoin(
          tables.feedbackOrganization,
          eq(
            tables.feedbackOrganization.id,
            tables.feedbackUser.feedbackOrganizationId
          )
        )
        .where(
          and(
            eq(tables.feedback.id, feedbackId),
            eq(tables.feedback.organizationId, organizationId)
          )
        )
        .limit(1)
        .then((rows) => rows[0] ?? null),
      database
        .select({
          id: tables.feedbackUser.id,
          name: tables.feedbackUser.name,
          imageUrl: tables.feedbackUser.imageUrl,
          email: tables.feedbackUser.email,
        })
        .from(tables.feedbackUser)
        .where(eq(tables.feedbackUser.organizationId, organizationId)),
      database
        .select({
          id: tables.feedbackOrganization.id,
          name: tables.feedbackOrganization.name,
          domain: tables.feedbackOrganization.domain,
        })
        .from(tables.feedbackOrganization)
        .where(eq(tables.feedbackOrganization.organizationId, organizationId)),
    ]
  );

  if (!feedbackRow) {
    return null;
  }

  return {
    user,
    feedback: buildFeedback(feedbackRow),
    feedbackUsers,
    feedbackOrganizations,
  };
};

export const FeedbackPanel = async ({ feedbackId }: FeedbackPanelProps) => {
  const data = await loadFeedbackPanelData(feedbackId);

  if (!data) {
    return null;
  }

  const { user, feedback, feedbackUsers, feedbackOrganizations } = data;

  const tabs = [
    {
      label: "Summary",
      value: feedback.analysis?.summary,
    },
    {
      label: "Pain Points",
      value: feedback.analysis?.painPoints,
    },
    {
      label: "Recommendations",
      value: feedback.analysis?.recommendations,
    },
    {
      label: "Outcomes",
      value: feedback.analysis?.outcomes,
    },
  ];

  return (
    <StackCard className="p-0 text-sm">
      <div className="grid gap-2 p-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground">Created</p>
          <p>{formatDate(new Date(feedback.createdAt))}</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground">Processed</p>
          <p>{feedback.processed ? "Yes" : "No"}</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground">Feedback User</p>
          {feedback.feedbackUser ? (
            <Link
              className="flex items-center gap-2"
              href={`/data/users/${feedback.feedbackUser.id}`}
            >
              <Avatar
                fallback={feedback.feedbackUser.name.slice(0, 2)}
                size={20}
                src={feedback.feedbackUser.imageUrl ?? undefined}
              />
              <p>{feedback.feedbackUser.name}</p>
            </Link>
          ) : (
            <p className="text-muted-foreground">None</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground">Feedback Organization</p>
          {feedback.feedbackUser?.feedbackOrganization ? (
            <Link
              className="flex items-center gap-2"
              href={`/data/companies/${feedback.feedbackUser.feedbackOrganization.id}`}
            >
              <CompanyLogo
                fallback={feedback.feedbackUser.feedbackOrganization.name.slice(
                  0,
                  2
                )}
                size={20}
                src={feedback.feedbackUser.feedbackOrganization.domain}
              />
              <p>{feedback.feedbackUser.feedbackOrganization.name}</p>
            </Link>
          ) : (
            <p className="text-muted-foreground">None</p>
          )}
        </div>
        {feedback.aiSentiment ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-primary">
              <SparklesIcon size={16} />
              <p className="m-0">Sentiment</p>
            </div>
            <div className="flex items-center gap-2">
              <SentimentEmoji
                description={feedback.aiSentimentReason}
                value={feedback.aiSentiment}
              />
              <p>{formatSentimentLabel(feedback.aiSentiment)}</p>
            </div>
          </div>
        ) : null}

        {feedback.analysis ? (
          <Accordion className="grid gap-2" type="multiple">
            {tabs.map((tab) => (
              <AccordionItem
                className="border-none"
                key={tab.label}
                value={tab.label}
              >
                <AccordionTrigger className="p-0 font-normal no-underline">
                  <div className="flex items-center gap-2 text-primary">
                    <SparklesIcon size={16} />
                    <p className="m-0">{tab.label}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="mt-2 p-0">
                  {tab.value ? (
                    <Prose className="!max-w-none !text-sm">
                      <Markdown>{tab.value}</Markdown>
                    </Prose>
                  ) : (
                    <p className="text-muted-foreground">None.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : null}
      </div>
      {user.organizationRole === PortalRole.Member ? null : (
        <div className="flex items-center justify-between border-t p-1">
          <ProcessFeedbackButton
            defaultValue={feedback.processed}
            feedbackId={feedbackId}
          />
          <FeedbackSettingsDropdown
            defaultFeedbackOrganizationId={
              feedback.feedbackUser?.feedbackOrganization?.id
            }
            defaultFeedbackUserId={feedback.feedbackUser?.id}
            feedbackId={feedbackId}
            organizations={feedbackOrganizations}
            users={feedbackUsers}
          />
        </div>
      )}
    </StackCard>
  );
};
