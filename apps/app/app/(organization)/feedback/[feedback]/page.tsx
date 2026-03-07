import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
} from "@repo/design-system/components/kibo-ui/video-player";
import { StackCard } from "@repo/design-system/components/stack-card";
import type { JSONContent } from "@repo/editor";
import { contentToText } from "@repo/editor/lib/tiptap";
import { createMetadata } from "@repo/lib/metadata";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FeedbackEditor } from "./components/feedback-editor";
import { FeedbackPanel } from "./components/feedback-panel";
import { FeedbackTitle } from "./components/feedback-title";
import { TriageMenu } from "./components/triage-menu";

type FeedbackPageProperties = {
  readonly params: Promise<{
    feedback: string;
  }>;
};

export const generateMetadata = async (
  props: FeedbackPageProperties
): Promise<Metadata> => {
  const params = await props.params;
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return {};
  }

  const feedback = await database
    .select({ title: tables.feedback.title, id: tables.feedback.id })
    .from(tables.feedback)
    .where(
      and(
        eq(tables.feedback.id, params.feedback),
        eq(tables.feedback.organizationId, organizationId)
      )
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!feedback) {
    return {};
  }

  const { title } = feedback;
  const content = await getJsonColumnFromTable(
    "feedback",
    "content",
    feedback.id
  );
  const text = content ? contentToText(content) : "";

  return createMetadata({
    title,
    description: text.slice(0, 150),
  });
};

const FeedbackPageContent = async (props: FeedbackPageProperties) => {
  const params = await props.params;
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    notFound();
  }

  const [feedback, featuresRaw, organization] = await Promise.all([
    database
      .select({
        id: tables.feedback.id,
        title: tables.feedback.title,
        audioUrl: tables.feedback.audioUrl,
        videoUrl: tables.feedback.videoUrl,
        transcript: tables.feedback.transcript,
      })
      .from(tables.feedback)
      .where(
        and(
          eq(tables.feedback.id, params.feedback),
          eq(tables.feedback.organizationId, organizationId)
        )
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
    database
      .select({
        id: tables.feature.id,
        title: tables.feature.title,
        productName: tables.product.name,
        groupName: tables.group.name,
        statusColor: tables.featureStatus.color,
      })
      .from(tables.feature)
      .leftJoin(tables.product, eq(tables.product.id, tables.feature.productId))
      .leftJoin(tables.group, eq(tables.group.id, tables.feature.groupId))
      .leftJoin(
        tables.featureStatus,
        eq(tables.featureStatus.id, tables.feature.statusId)
      )
      .where(eq(tables.feature.organizationId, organizationId)),
    database
      .select({ id: tables.organization.id })
      .from(tables.organization)
      .where(eq(tables.organization.id, organizationId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  if (!(feedback && organization)) {
    notFound();
  }

  const processingMedia =
    (feedback.audioUrl ?? feedback.videoUrl) && !feedback.transcript;

  const content =
    (await getJsonColumnFromTable("feedback", "content", params.feedback)) ??
    undefined;
  const features = featuresRaw.map((feature) => ({
    id: feature.id,
    title: feature.title,
    product: feature.productName ? { name: feature.productName } : null,
    group: feature.groupName ? { name: feature.groupName } : null,
    status: { color: feature.statusColor ?? "" },
  }));

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="mx-auto grid w-full max-w-prose gap-6 px-6 py-16">
        <FeedbackTitle
          defaultTitle={feedback.title}
          editable={user.organizationRole !== PortalRole.Member}
          feedbackId={params.feedback}
        />
        <Suspense fallback={null}>
          <FeedbackPanel feedbackId={params.feedback} />
        </Suspense>
        {feedback.audioUrl ? (
          <StackCard title="Feedback Audio">
            <audio
              aria-label="Feedback audio"
              className="w-full"
              controls
              src={feedback.audioUrl}
            >
              <track kind="captions" label="English" src="" />
            </audio>
          </StackCard>
        ) : null}
        {feedback.videoUrl ? (
          <StackCard className="p-0" title="Feedback Video">
            <VideoPlayer className="flex flex-col">
              <VideoPlayerContent
                crossOrigin=""
                muted
                preload="auto"
                slot="media"
                src={feedback.videoUrl}
              />
              <VideoPlayerControlBar>
                <VideoPlayerPlayButton />
                <VideoPlayerSeekBackwardButton />
                <VideoPlayerSeekForwardButton />
                <VideoPlayerTimeRange />
                <VideoPlayerTimeDisplay showDuration />
                <VideoPlayerMuteButton />
                <VideoPlayerVolumeRange />
              </VideoPlayerControlBar>
            </VideoPlayer>
          </StackCard>
        ) : null}
        {processingMedia ? (
          <p className="text-muted-foreground text-sm">
            Processing transcript. Please check back later.
          </p>
        ) : (
          <FeedbackEditor
            defaultValue={content as JSONContent}
            editable={user.organizationRole !== PortalRole.Member}
            feedbackId={params.feedback}
          >
            <TriageMenu
              aiEnabled={true}
              features={features}
              feedbackId={params.feedback}
            />
          </FeedbackEditor>
        )}
      </div>
    </div>
  );
};

const FeedbackPage = (props: FeedbackPageProperties) => (
  <Suspense fallback={null}>
    <FeedbackPageContent {...props} />
  </Suspense>
);

export default FeedbackPage;
