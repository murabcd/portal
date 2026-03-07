import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { eq, sql } from "drizzle-orm";
import { Suspense } from "react";
import { FeedbackEmptyState } from "@/app/(organization)/feedback/components/feedback-empty-state";
import { IncomingChart } from "./incoming-chart";
import { ProcessedChart } from "./processed-chart";
import { SentimentChart } from "./sentiment-chart";
import { FeedbackTrend } from "./trend";

export const FeedbackSection = async () => {
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return <div />;
  }

  const feedbackCount =
    (await database
      .select({ count: sql<number>`count(*)` })
      .from(tables.feedback)
      .where(eq(tables.feedback.organizationId, organizationId))
      .then((rows) => rows[0]?.count)) ?? 0;

  if (feedbackCount === 0) {
    return (
      <div className="p-16">
        <FeedbackEmptyState />
      </div>
    );
  }

  return (
    <section className="space-y-4 p-4 sm:p-8">
      <div>
        <p className="font-medium text-sm">Feedback</p>
        <Suspense fallback={null}>
          <FeedbackTrend />
        </Suspense>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        <Suspense fallback={null}>
          <SentimentChart />
        </Suspense>
        <Suspense fallback={null}>
          <ProcessedChart />
        </Suspense>
        <div className="sm:col-span-2">
          <Suspense fallback={null}>
            <IncomingChart />
          </Suspense>
        </div>
      </div>
    </section>
  );
};
