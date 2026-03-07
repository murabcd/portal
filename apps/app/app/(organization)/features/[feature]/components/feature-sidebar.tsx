import { PortalRole } from "@repo/backend/auth";
import {
  currentMembers,
  currentOrganizationId,
  currentUser,
} from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import type { Feature, Feedback } from "@repo/backend/types";
import { Button } from "@repo/design-system/components/ui/button";
import { contentToText } from "@repo/editor/lib/tiptap";
import { formatDate } from "@repo/lib/format";
import { asc, eq, inArray } from "drizzle-orm";
import { SparklesIcon } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { FeedbackItem } from "@/app/(organization)/feedback/components/feedback-item";
import {
  Item as SettingsBarItem,
  Root as SettingsBarRoot,
} from "@/components/settings-bar";
import { calculateRice } from "@/lib/rice";
import { toMemberInfoList } from "@/lib/serialization";
import { ConnectButton } from "./connect-button";
import { DisconnectButton } from "./disconnect-button";
import { FeatureClearDateButton } from "./feature-clear-date-button";
import { FeatureClearReleaseButton } from "./feature-clear-release-button";
import { FeatureDateRangePicker } from "./feature-date-range-picker";
import { FeatureGroupPicker } from "./feature-group-picker";
import { FeatureOwnerPicker } from "./feature-owner-picker";
import { FeaturePageTabs } from "./feature-page-tabs";
import { FeatureProductPicker } from "./feature-product-picker";
import { FeatureReleasePicker } from "./feature-release-picker";
import { FeatureRiceEditor } from "./feature-rice-editor";
import { FeatureSettingsDropdown } from "./feature-settings-dropdown";
import { FeatureStatusPicker } from "./feature-status-picker";

type FeatureSidebarProperties = {
  readonly featureId: Feature["id"];
};

const fetchOrganization = async (organizationId: string) =>
  database
    .select({ id: tables.organization.id })
    .from(tables.organization)
    .where(eq(tables.organization.id, organizationId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

const fetchFeature = async (featureId: string) =>
  database
    .select({
      id: tables.feature.id,
      createdAt: tables.feature.createdAt,
      ownerId: tables.feature.ownerId,
      statusId: tables.feature.statusId,
      startAt: tables.feature.startAt,
      endAt: tables.feature.endAt,
      releaseId: tables.feature.releaseId,
      productId: tables.feature.productId,
      groupId: tables.feature.groupId,
    })
    .from(tables.feature)
    .where(eq(tables.feature.id, featureId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

const fetchFeatureStatuses = async (organizationId: string) =>
  database
    .select({
      id: tables.featureStatus.id,
      name: tables.featureStatus.name,
      color: tables.featureStatus.color,
    })
    .from(tables.featureStatus)
    .where(eq(tables.featureStatus.organizationId, organizationId))
    .orderBy(asc(tables.featureStatus.order));

const fetchProducts = async (organizationId: string) =>
  database
    .select({
      id: tables.product.id,
      name: tables.product.name,
      emoji: tables.product.emoji,
    })
    .from(tables.product)
    .where(eq(tables.product.organizationId, organizationId))
    .orderBy(asc(tables.product.name));

const fetchReleases = async (organizationId: string) =>
  database
    .select({ id: tables.release.id, title: tables.release.title })
    .from(tables.release)
    .where(eq(tables.release.organizationId, organizationId))
    .orderBy(asc(tables.release.title));

const fetchTemplates = async (organizationId: string) =>
  database
    .select({ id: tables.template.id, title: tables.template.title })
    .from(tables.template)
    .where(eq(tables.template.organizationId, organizationId));

const fetchProductGroups = async (products: { id: string }[]) =>
  products.length
    ? database
        .select({
          id: tables.group.id,
          name: tables.group.name,
          emoji: tables.group.emoji,
          productId: tables.group.productId,
        })
        .from(tables.group)
        .where(
          inArray(
            tables.group.productId,
            products.map((productItem) => productItem.id)
          )
        )
    : [];

const mapProductsWithGroups = (
  products: { id: string; name: string; emoji: string }[],
  productGroups: {
    id: string;
    name: string;
    emoji: string;
    productId: string | null;
  }[]
) =>
  products.map((productItem) => ({
    ...productItem,
    groups: productGroups
      .filter((groupItem) => groupItem.productId === productItem.id)
      .map((groupItem) => ({
        ...groupItem,
        productId: groupItem.productId ?? productItem.id,
      })),
  }));

const fetchFeatureRelations = async (feature: {
  id: string;
  productId: string | null;
  groupId: string | null;
}) =>
  Promise.all([
    feature.productId
      ? database
          .select({ id: tables.product.id })
          .from(tables.product)
          .where(eq(tables.product.id, feature.productId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
    feature.groupId
      ? database
          .select({ id: tables.group.id })
          .from(tables.group)
          .where(eq(tables.group.id, feature.groupId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
    database
      .select({
        reach: tables.featureRice.reach,
        impact: tables.featureRice.impact,
        confidence: tables.featureRice.confidence,
        effort: tables.featureRice.effort,
      })
      .from(tables.featureRice)
      .where(eq(tables.featureRice.featureId, feature.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    database
      .select({
        reach: tables.aiFeatureRice.reach,
        impact: tables.aiFeatureRice.impact,
        confidence: tables.aiFeatureRice.confidence,
        effort: tables.aiFeatureRice.effort,
        reachReason: tables.aiFeatureRice.reachReason,
        impactReason: tables.aiFeatureRice.impactReason,
        confidenceReason: tables.aiFeatureRice.confidenceReason,
        effortReason: tables.aiFeatureRice.effortReason,
      })
      .from(tables.aiFeatureRice)
      .where(eq(tables.aiFeatureRice.featureId, feature.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    database
      .select({
        id: tables.featureConnection.id,
        href: tables.featureConnection.href,
        type: tables.featureConnection.type,
      })
      .from(tables.featureConnection)
      .where(eq(tables.featureConnection.featureId, feature.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

const fetchFeatureFeedback = async (featureId: string) =>
  database
    .select({
      feedbackId: tables.feedback.id,
      feedbackTitle: tables.feedback.title,
      feedbackCreatedAt: tables.feedback.createdAt,
      feedbackAiSentiment: tables.feedback.aiSentiment,
      feedbackUserName: tables.feedbackUser.name,
      feedbackUserEmail: tables.feedbackUser.email,
      feedbackUserImageUrl: tables.feedbackUser.imageUrl,
    })
    .from(tables.feedbackFeatureLink)
    .innerJoin(
      tables.feedback,
      eq(tables.feedback.id, tables.feedbackFeatureLink.feedbackId)
    )
    .leftJoin(
      tables.feedbackUser,
      eq(tables.feedbackUser.id, tables.feedback.feedbackUserId)
    )
    .where(eq(tables.feedbackFeatureLink.featureId, featureId));

const fetchFeatureCustomFields = async (featureId: string) =>
  database
    .select({
      id: tables.featureCustomFieldValue.id,
      value: tables.featureCustomFieldValue.value,
      name: tables.featureCustomField.name,
    })
    .from(tables.featureCustomFieldValue)
    .innerJoin(
      tables.featureCustomField,
      eq(
        tables.featureCustomField.id,
        tables.featureCustomFieldValue.customFieldId
      )
    )
    .where(eq(tables.featureCustomFieldValue.featureId, featureId));

const buildFeatureWithRelations = ({
  feature,
  relations,
  productsWithGroups,
  feedbackRows,
  customFieldRows,
}: {
  feature: {
    id: string;
    createdAt: string;
    ownerId: string;
    statusId: string;
    startAt: string | null;
    endAt: string | null;
    releaseId: string | null;
    productId: string | null;
    groupId: string | null;
  };
  relations: [
    { id: string } | null,
    { id: string } | null,
    {
      reach: number;
      impact: number;
      confidence: number;
      effort: number;
    } | null,
    {
      reach: number;
      impact: number;
      confidence: number;
      effort: number;
      reachReason: string;
      impactReason: string;
      confidenceReason: string;
      effortReason: string;
    } | null,
    { id: string; href: string; type: string } | null,
  ];
  productsWithGroups: {
    id: string;
    name: string;
    emoji: string;
    groups: { id: string; name: string; emoji: string; productId: string }[];
  }[];
  feedbackRows: {
    feedbackId: string;
    feedbackTitle: string;
    feedbackCreatedAt: string;
    feedbackAiSentiment: Feedback["aiSentiment"] | null;
    feedbackUserName: string | null;
    feedbackUserEmail: string | null;
    feedbackUserImageUrl: string | null;
  }[];
  customFieldRows: { id: string; value: string; name: string }[];
}) => {
  const [product, group, rice, aiRice, connection] = relations;

  return {
    ...feature,
    product: product
      ? {
          ...product,
          groups:
            productsWithGroups.find((item) => item.id === product.id)?.groups ??
            [],
        }
      : null,
    group,
    rice,
    aiRice,
    connection,
    feedback: feedbackRows.map((feedbackItem) => ({
      feedback: {
        id: feedbackItem.feedbackId,
        title: feedbackItem.feedbackTitle,
        createdAt: feedbackItem.feedbackCreatedAt,
        aiSentiment: feedbackItem.feedbackAiSentiment,
        feedbackUser: feedbackItem.feedbackUserName
          ? {
              name: feedbackItem.feedbackUserName,
              email: feedbackItem.feedbackUserEmail ?? "",
              imageUrl: feedbackItem.feedbackUserImageUrl ?? "",
            }
          : null,
      },
    })),
    customFields: customFieldRows.map((field) => ({
      id: field.id,
      value: field.value,
      customField: { name: field.name },
    })),
  };
};

const getRiceScoreCaption = (
  riceScore: number | null,
  aiRiceScore: number | null
): ReactNode | undefined => {
  if (riceScore) {
    return (
      <span className="text-muted-foreground text-sm">
        {riceScore.toString()}
      </span>
    );
  }

  if (aiRiceScore) {
    return (
      <div className="flex items-center gap-1 text-primary text-sm">
        <SparklesIcon size={16} />
        <span>{aiRiceScore.toString()}</span>
      </div>
    );
  }

  return;
};

const enrichFeedbackContent = (
  feedbackItems: {
    feedback: {
      id: string;
      title: string;
      createdAt: string;
      aiSentiment: Feedback["aiSentiment"] | null;
      feedbackUser: {
        name: string;
        email: string;
        imageUrl: string;
      } | null;
    };
  }[],
  contentByFeedbackId: Map<string, JsonValue | null>
) =>
  feedbackItems.map((feedbackItem) => ({
    ...feedbackItem.feedback,
    text: contentToText(
      contentByFeedbackId.get(feedbackItem.feedback.id) ?? null
    ),
  }));

const loadFeatureSidebarData = async (featureId: Feature["id"]) => {
  const [user, organizationId, members] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
    currentMembers(),
  ]);

  if (!(user && organizationId)) {
    return null;
  }

  const [
    organization,
    feature,
    featureStatuses,
    products,
    releases,
    templates,
  ] = await Promise.all([
    fetchOrganization(organizationId),
    fetchFeature(featureId),
    fetchFeatureStatuses(organizationId),
    fetchProducts(organizationId),
    fetchReleases(organizationId),
    fetchTemplates(organizationId),
  ]);

  if (!(organization && feature)) {
    return null;
  }

  const [productGroups, relations, feedback, customFields] = await Promise.all([
    fetchProductGroups(products),
    fetchFeatureRelations(feature),
    fetchFeatureFeedback(feature.id),
    fetchFeatureCustomFields(feature.id),
  ]);

  const feedbackIds = feedback.map((item) => item.feedbackId);
  const feedbackContents = feedbackIds.length
    ? await database
        .select({ id: tables.feedback.id, content: tables.feedback.content })
        .from(tables.feedback)
        .where(inArray(tables.feedback.id, feedbackIds))
    : [];
  const contentByFeedbackId = new Map(
    feedbackContents.map((row) => [row.id, row.content ?? null])
  );
  const productsWithGroups = mapProductsWithGroups(products, productGroups);

  const featureWithRelations = buildFeatureWithRelations({
    feature,
    relations,
    productsWithGroups,
    feedbackRows: feedback,
    customFieldRows: customFields,
  });
  const modifiedFeedback = enrichFeedbackContent(
    featureWithRelations.feedback,
    contentByFeedbackId
  );

  return {
    user,
    members,
    featureStatuses,
    productsWithGroups,
    releases,
    templates,
    featureWithRelations,
    modifiedFeedback,
  };
};

export const FeatureSidebar = async ({
  featureId,
}: FeatureSidebarProperties) => {
  const data = await loadFeatureSidebarData(featureId);

  if (!data) {
    notFound();
  }

  const {
    user,
    members,
    featureStatuses,
    productsWithGroups,
    releases,
    templates,
    featureWithRelations,
    modifiedFeedback,
  } = data;
  const membersLite = toMemberInfoList(members);

  const riceScore = featureWithRelations.rice
    ? calculateRice(featureWithRelations.rice)
    : null;
  const aiRiceScore = featureWithRelations.aiRice
    ? calculateRice(featureWithRelations.aiRice)
    : null;

  const riceScoreCaption = getRiceScoreCaption(riceScore, aiRiceScore);

  const featureConnectionSource = "/jira.svg";
  const product = featureWithRelations.product;
  const shouldShowGroupPicker = product !== null;
  const hasConnectionSource = featureConnectionSource.length > 0;

  return (
    <SettingsBarRoot>
      {user.organizationRole !== PortalRole.Member && (
        <FeatureSettingsDropdown
          featureId={featureWithRelations.id}
          templates={templates}
        />
      )}

      <SettingsBarItem title="Created">
        <p className="text-sm">
          {formatDate(new Date(featureWithRelations.createdAt))}
        </p>
      </SettingsBarItem>

      <SettingsBarItem title="Switch View">
        <Suspense fallback={null}>
          <FeaturePageTabs id={featureWithRelations.id} />
        </Suspense>
      </SettingsBarItem>

      <SettingsBarItem title="Owner">
        <FeatureOwnerPicker
          data={membersLite}
          defaultValue={featureWithRelations.ownerId}
          disabled={user.organizationRole === PortalRole.Member}
          featureId={featureWithRelations.id}
        />
      </SettingsBarItem>

      <SettingsBarItem title="Product">
        <FeatureProductPicker
          data={productsWithGroups}
          defaultValue={featureWithRelations.product?.id ?? undefined}
          disabled={user.organizationRole === PortalRole.Member}
          featureId={featureWithRelations.id}
        />
      </SettingsBarItem>

      {shouldShowGroupPicker ? (
        <SettingsBarItem title="Group">
          <FeatureGroupPicker
            data={product?.groups ?? []}
            defaultValue={featureWithRelations.group?.id ?? undefined}
            disabled={
              user.organizationRole === PortalRole.Member ||
              !(product?.groups.length ?? 0)
            }
            featureId={featureWithRelations.id}
          />
        </SettingsBarItem>
      ) : null}

      <SettingsBarItem title="Status">
        <FeatureStatusPicker
          defaultValue={featureWithRelations.statusId}
          disabled={user.organizationRole === PortalRole.Member}
          featureId={featureWithRelations.id}
          statuses={featureStatuses}
        />
      </SettingsBarItem>

      <SettingsBarItem
        action={
          user.organizationRole !== PortalRole.Member && (
            <FeatureClearReleaseButton featureId={featureWithRelations.id} />
          )
        }
        title="Release"
      >
        <FeatureReleasePicker
          defaultValue={featureWithRelations.releaseId ?? undefined}
          disabled={user.organizationRole === PortalRole.Member}
          featureId={featureWithRelations.id}
          releases={releases}
        />
      </SettingsBarItem>

      <SettingsBarItem
        action={
          user.organizationRole !== PortalRole.Member && (
            <FeatureClearDateButton featureId={featureWithRelations.id} />
          )
        }
        title="Date"
      >
        <FeatureDateRangePicker
          defaultEndAt={featureWithRelations.endAt}
          defaultStartAt={featureWithRelations.startAt}
          disabled={user.organizationRole === PortalRole.Member}
          featureId={featureWithRelations.id}
        />
      </SettingsBarItem>

      <SettingsBarItem action={riceScoreCaption} title="RICE Score">
        <FeatureRiceEditor
          aiRice={featureWithRelations.aiRice}
          disabled={user.organizationRole === PortalRole.Member}
          featureId={featureWithRelations.id}
          rice={featureWithRelations.rice}
        />
      </SettingsBarItem>

      <SettingsBarItem title="Synced Issue">
        {featureWithRelations.connection ? (
          <>
            <Button asChild variant="outline">
              <a
                aria-label="Connection"
                className="flex items-center gap-2"
                href={featureWithRelations.connection.href}
                rel="noreferrer"
                target="_blank"
              >
                {hasConnectionSource ? (
                  <Image
                    alt=""
                    height={16}
                    src={featureConnectionSource}
                    width={16}
                  />
                ) : null}
                <span>View connected feature</span>
              </a>
            </Button>
            <DisconnectButton
              connectionId={featureWithRelations.connection.id}
            />
          </>
        ) : (
          <div className="flex flex-col">
            {user.organizationRole === PortalRole.Member ? null : (
              <ConnectButton featureId={featureWithRelations.id} />
            )}
          </div>
        )}
      </SettingsBarItem>

      {modifiedFeedback.length > 0 ? (
        <SettingsBarItem title="Linked Feedback">
          <Suspense fallback={null}>
            {modifiedFeedback.map((feedbackItem) => (
              <div className="overflow-hidden rounded-md" key={feedbackItem.id}>
                <FeedbackItem feedback={feedbackItem} />
              </div>
            ))}
          </Suspense>
        </SettingsBarItem>
      ) : null}

      {featureWithRelations.customFields.length > 0 ? (
        <SettingsBarItem title="Custom Fields">
          {featureWithRelations.customFields.map((field) => (
            <div className="flex items-center gap-2 text-sm" key={field.id}>
              <p className="truncate text-muted-foreground">
                {field.customField.name}
              </p>
              <p className="truncate font-medium">{field.value}</p>
            </div>
          ))}
        </SettingsBarItem>
      ) : null}
    </SettingsBarRoot>
  );
};
