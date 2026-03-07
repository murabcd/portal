import { getUserName } from "@repo/backend/auth/format";
import {
  currentMembers,
  currentOrganizationId,
} from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type {
  ApiKey,
  Changelog,
  Feature,
  Feedback,
  FeedbackFeatureLink,
  FeedbackOrganization,
  FeedbackUser,
  Group,
  Initiative,
  InitiativeCanvas,
  InitiativeExternalLink,
  InitiativeMember,
  InitiativePage,
  Product,
  Release,
} from "@repo/backend/types";
import { subDays } from "date-fns";
import { and, desc, eq, gte, lte } from "drizzle-orm";

type WithDate<T> = Omit<T, "createdAt"> & { createdAt: Date };

export type GetActivityResponse = {
  initiatives: WithDate<
    Pick<Initiative, "createdAt" | "creatorId" | "id" | "title">
  >[];
  initiativeMembers: (WithDate<
    Pick<InitiativeMember, "createdAt" | "creatorId" | "id" | "userId">
  > & {
    initiative: Pick<Initiative, "id" | "title">;
  })[];
  initiativePages: (WithDate<
    Pick<InitiativePage, "createdAt" | "creatorId" | "id" | "title">
  > & {
    initiative: Pick<Initiative, "id" | "title">;
  })[];
  initiativeCanvases: (WithDate<
    Pick<InitiativeCanvas, "createdAt" | "creatorId" | "id" | "title">
  > & {
    initiative: Pick<Initiative, "id" | "title">;
  })[];
  initiativeExternalLinks: (WithDate<
    Pick<
      InitiativeExternalLink,
      "createdAt" | "creatorId" | "href" | "id" | "title"
    >
  > & {
    initiative: Pick<Initiative, "id" | "title">;
  })[];
  feedback: (WithDate<
    Pick<Feedback, "createdAt" | "id" | "source" | "title">
  > & {
    feedbackUser:
      | (Pick<FeedbackUser, "imageUrl" | "name"> & {
          feedbackOrganization: Pick<FeedbackOrganization, "name"> | null;
        })
      | null;
  })[];
  products: WithDate<
    Pick<Product, "createdAt" | "creatorId" | "id" | "name">
  >[];
  groups: WithDate<Pick<Group, "createdAt" | "creatorId" | "id" | "name">>[];
  features: WithDate<
    Pick<Feature, "createdAt" | "creatorId" | "id" | "source" | "title">
  >[];
  changelog: WithDate<
    Pick<Changelog, "createdAt" | "creatorId" | "id" | "title">
  >[];
  apiKeys: WithDate<Pick<ApiKey, "createdAt" | "creatorId" | "id" | "name">>[];
  feedbackFeatureLinks: (WithDate<
    Pick<FeedbackFeatureLink, "createdAt" | "creatorId" | "id">
  > & {
    feedback: Pick<Feedback, "id" | "title">;
    feature: Pick<Feature, "id" | "title">;
  })[];
  releases: WithDate<
    Pick<Release, "createdAt" | "creatorId" | "id" | "title">
  >[];
  members: {
    id: string;
    createdAt: Date;
    userImage: string | undefined;
    userName: string | undefined;
  }[];
  date: Date;
};

export const getActivity = async (
  page: number
): Promise<
  | {
      data: GetActivityResponse;
    }
  | {
      error: unknown;
    }
> => {
  try {
    const organizationId = await currentOrganizationId();
    const date = subDays(new Date(), page);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    const startOfDayIso = startOfDay.toISOString();
    const endOfDayIso = endOfDay.toISOString();

    if (!organizationId) {
      throw new Error("Not logged in");
    }

    const [
      members,
      initiatives,
      initiativeMembers,
      initiativePages,
      initiativeCanvases,
      initiativeExternalLinks,
      feedbackRows,
      products,
      groups,
      features,
      changelog,
      apiKeys,
      feedbackFeatureLinks,
      releases,
    ] = await Promise.all([
      currentMembers(),
      database
        .select({
          id: tables.initiative.id,
          title: tables.initiative.title,
          creatorId: tables.initiative.creatorId,
          createdAt: tables.initiative.createdAt,
        })
        .from(tables.initiative)
        .where(
          and(
            eq(tables.initiative.organizationId, organizationId),
            gte(tables.initiative.createdAt, startOfDayIso),
            lte(tables.initiative.createdAt, endOfDayIso)
          )
        )
        .orderBy(desc(tables.initiative.createdAt))
        .limit(50),
      database
        .select({
          id: tables.initiativeMember.id,
          userId: tables.initiativeMember.userId,
          createdAt: tables.initiativeMember.createdAt,
          creatorId: tables.initiativeMember.creatorId,
          initiativeId: tables.initiative.id,
          initiativeTitle: tables.initiative.title,
        })
        .from(tables.initiativeMember)
        .innerJoin(
          tables.initiative,
          eq(tables.initiativeMember.initiativeId, tables.initiative.id)
        )
        .where(
          and(
            eq(tables.initiativeMember.organizationId, organizationId),
            gte(tables.initiativeMember.createdAt, startOfDayIso),
            lte(tables.initiativeMember.createdAt, endOfDayIso)
          )
        )
        .orderBy(desc(tables.initiativeMember.createdAt))
        .limit(50),
      database
        .select({
          id: tables.initiativePage.id,
          title: tables.initiativePage.title,
          creatorId: tables.initiativePage.creatorId,
          createdAt: tables.initiativePage.createdAt,
          initiativeId: tables.initiative.id,
          initiativeTitle: tables.initiative.title,
        })
        .from(tables.initiativePage)
        .innerJoin(
          tables.initiative,
          eq(tables.initiativePage.initiativeId, tables.initiative.id)
        )
        .where(
          and(
            eq(tables.initiativePage.organizationId, organizationId),
            gte(tables.initiativePage.createdAt, startOfDayIso),
            lte(tables.initiativePage.createdAt, endOfDayIso)
          )
        )
        .orderBy(desc(tables.initiativePage.createdAt))
        .limit(50),
      database
        .select({
          id: tables.initiativeCanvas.id,
          title: tables.initiativeCanvas.title,
          creatorId: tables.initiativeCanvas.creatorId,
          createdAt: tables.initiativeCanvas.createdAt,
          initiativeId: tables.initiative.id,
          initiativeTitle: tables.initiative.title,
        })
        .from(tables.initiativeCanvas)
        .innerJoin(
          tables.initiative,
          eq(tables.initiativeCanvas.initiativeId, tables.initiative.id)
        )
        .where(
          and(
            eq(tables.initiativeCanvas.organizationId, organizationId),
            gte(tables.initiativeCanvas.createdAt, startOfDayIso),
            lte(tables.initiativeCanvas.createdAt, endOfDayIso)
          )
        )
        .orderBy(desc(tables.initiativeCanvas.createdAt))
        .limit(50),
      database
        .select({
          id: tables.initiativeExternalLink.id,
          title: tables.initiativeExternalLink.title,
          creatorId: tables.initiativeExternalLink.creatorId,
          createdAt: tables.initiativeExternalLink.createdAt,
          href: tables.initiativeExternalLink.href,
          initiativeId: tables.initiative.id,
          initiativeTitle: tables.initiative.title,
        })
        .from(tables.initiativeExternalLink)
        .innerJoin(
          tables.initiative,
          eq(tables.initiativeExternalLink.initiativeId, tables.initiative.id)
        )
        .where(
          and(
            eq(tables.initiativeExternalLink.organizationId, organizationId),
            gte(tables.initiativeExternalLink.createdAt, startOfDayIso),
            lte(tables.initiativeExternalLink.createdAt, endOfDayIso)
          )
        )
        .orderBy(desc(tables.initiativeExternalLink.createdAt))
        .limit(50),
      database
        .select({
          id: tables.feedback.id,
          title: tables.feedback.title,
          source: tables.feedback.source,
          createdAt: tables.feedback.createdAt,
          feedbackUserName: tables.feedbackUser.name,
          feedbackUserImageUrl: tables.feedbackUser.imageUrl,
          feedbackOrganizationName: tables.feedbackOrganization.name,
        })
        .from(tables.feedback)
        .leftJoin(
          tables.feedbackUser,
          eq(tables.feedback.feedbackUserId, tables.feedbackUser.id)
        )
        .leftJoin(
          tables.feedbackOrganization,
          eq(
            tables.feedbackUser.feedbackOrganizationId,
            tables.feedbackOrganization.id
          )
        )
        .where(
          and(
            eq(tables.feedback.organizationId, organizationId),
            gte(tables.feedback.createdAt, startOfDayIso),
            lte(tables.feedback.createdAt, endOfDayIso)
          )
        )
        .orderBy(desc(tables.feedback.createdAt))
        .limit(50),
      database
        .select({
          id: tables.product.id,
          name: tables.product.name,
          creatorId: tables.product.creatorId,
          createdAt: tables.product.createdAt,
        })
        .from(tables.product)
        .where(
          and(
            eq(tables.product.organizationId, organizationId),
            gte(tables.product.createdAt, startOfDayIso),
            lte(tables.product.createdAt, endOfDayIso)
          )
        )
        .orderBy(desc(tables.product.createdAt))
        .limit(50),
      database
        .select({
          id: tables.group.id,
          name: tables.group.name,
          creatorId: tables.group.creatorId,
          createdAt: tables.group.createdAt,
        })
        .from(tables.group)
        .where(
          and(
            eq(tables.group.organizationId, organizationId),
            gte(tables.group.createdAt, startOfDayIso),
            lte(tables.group.createdAt, endOfDayIso)
          )
        )
        .orderBy(desc(tables.group.createdAt))
        .limit(50),
      database
        .select({
          id: tables.feature.id,
          title: tables.feature.title,
          creatorId: tables.feature.creatorId,
          createdAt: tables.feature.createdAt,
          source: tables.feature.source,
        })
        .from(tables.feature)
        .where(
          and(
            eq(tables.feature.organizationId, organizationId),
            gte(tables.feature.createdAt, startOfDayIso),
            lte(tables.feature.createdAt, endOfDayIso)
          )
        )
        .orderBy(desc(tables.feature.createdAt))
        .limit(50),
      database
        .select({
          id: tables.changelog.id,
          title: tables.changelog.title,
          creatorId: tables.changelog.creatorId,
          createdAt: tables.changelog.createdAt,
        })
        .from(tables.changelog)
        .where(
          and(
            eq(tables.changelog.organizationId, organizationId),
            gte(tables.changelog.createdAt, startOfDayIso),
            lte(tables.changelog.createdAt, endOfDayIso)
          )
        )
        .orderBy(desc(tables.changelog.createdAt))
        .limit(50),
      database
        .select({
          id: tables.apiKey.id,
          name: tables.apiKey.name,
          creatorId: tables.apiKey.creatorId,
          createdAt: tables.apiKey.createdAt,
        })
        .from(tables.apiKey)
        .where(
          and(
            eq(tables.apiKey.organizationId, organizationId),
            gte(tables.apiKey.createdAt, startOfDayIso),
            lte(tables.apiKey.createdAt, endOfDayIso)
          )
        )
        .orderBy(desc(tables.apiKey.createdAt))
        .limit(50),
      database
        .select({
          id: tables.feedbackFeatureLink.id,
          creatorId: tables.feedbackFeatureLink.creatorId,
          createdAt: tables.feedbackFeatureLink.createdAt,
          feedbackId: tables.feedback.id,
          feedbackTitle: tables.feedback.title,
          featureId: tables.feature.id,
          featureTitle: tables.feature.title,
        })
        .from(tables.feedbackFeatureLink)
        .innerJoin(
          tables.feedback,
          eq(tables.feedbackFeatureLink.feedbackId, tables.feedback.id)
        )
        .innerJoin(
          tables.feature,
          eq(tables.feedbackFeatureLink.featureId, tables.feature.id)
        )
        .where(
          and(
            eq(tables.feedbackFeatureLink.organizationId, organizationId),
            gte(tables.feedbackFeatureLink.createdAt, startOfDayIso),
            lte(tables.feedbackFeatureLink.createdAt, endOfDayIso)
          )
        )
        .orderBy(desc(tables.feedbackFeatureLink.createdAt))
        .limit(50),
      database
        .select({
          id: tables.release.id,
          title: tables.release.title,
          creatorId: tables.release.creatorId,
          createdAt: tables.release.createdAt,
        })
        .from(tables.release)
        .where(
          and(
            eq(tables.release.organizationId, organizationId),
            gte(tables.release.createdAt, startOfDayIso),
            lte(tables.release.createdAt, endOfDayIso)
          )
        )
        .orderBy(desc(tables.release.createdAt))
        .limit(50),
    ]);

    const data = {
      date,
      initiatives: initiatives.map((row) => ({
        id: row.id,
        title: row.title,
        creatorId: row.creatorId,
        createdAt: new Date(row.createdAt),
      })),
      initiativeMembers: initiativeMembers.map((row) => ({
        id: row.id,
        userId: row.userId,
        createdAt: new Date(row.createdAt),
        creatorId: row.creatorId,
        initiative: {
          id: row.initiativeId,
          title: row.initiativeTitle,
        },
      })),
      initiativePages: initiativePages.map((row) => ({
        id: row.id,
        title: row.title,
        creatorId: row.creatorId,
        createdAt: new Date(row.createdAt),
        initiative: {
          id: row.initiativeId,
          title: row.initiativeTitle,
        },
      })),
      initiativeCanvases: initiativeCanvases.map((row) => ({
        id: row.id,
        title: row.title,
        creatorId: row.creatorId,
        createdAt: new Date(row.createdAt),
        initiative: {
          id: row.initiativeId,
          title: row.initiativeTitle,
        },
      })),
      initiativeExternalLinks: initiativeExternalLinks.map((row) => ({
        id: row.id,
        title: row.title,
        creatorId: row.creatorId,
        createdAt: new Date(row.createdAt),
        href: row.href,
        initiative: {
          id: row.initiativeId,
          title: row.initiativeTitle,
        },
      })),
      feedback: feedbackRows.map((row) => ({
        id: row.id,
        title: row.title,
        source: row.source,
        createdAt: new Date(row.createdAt),
        feedbackUser: row.feedbackUserName
          ? {
              name: row.feedbackUserName,
              imageUrl: row.feedbackUserImageUrl ?? "",
              feedbackOrganization: row.feedbackOrganizationName
                ? { name: row.feedbackOrganizationName }
                : null,
            }
          : null,
      })),
      products: products.map((row) => ({
        id: row.id,
        name: row.name,
        creatorId: row.creatorId,
        createdAt: new Date(row.createdAt),
      })),
      groups: groups.map((row) => ({
        id: row.id,
        name: row.name,
        creatorId: row.creatorId,
        createdAt: new Date(row.createdAt),
      })),
      features: features.map((row) => ({
        id: row.id,
        title: row.title,
        creatorId: row.creatorId,
        createdAt: new Date(row.createdAt),
        source: row.source,
      })),
      changelog: changelog.map((row) => ({
        id: row.id,
        title: row.title,
        creatorId: row.creatorId,
        createdAt: new Date(row.createdAt),
      })),
      apiKeys: apiKeys.map((row) => ({
        id: row.id,
        name: row.name,
        creatorId: row.creatorId,
        createdAt: new Date(row.createdAt),
      })),
      feedbackFeatureLinks: feedbackFeatureLinks.map((row) => ({
        id: row.id,
        creatorId: row.creatorId,
        createdAt: new Date(row.createdAt),
        feedback: {
          id: row.feedbackId,
          title: row.feedbackTitle,
        },
        feature: {
          id: row.featureId,
          title: row.featureTitle,
        },
      })),
      releases: releases.map((row) => ({
        id: row.id,
        title: row.title,
        creatorId: row.creatorId,
        createdAt: new Date(row.createdAt),
      })),
      members: members
        .map((member) => ({
          member,
          createdAt: member.createdAt ? new Date(member.createdAt) : null,
        }))
        .filter(
          ({ createdAt }) =>
            createdAt !== null &&
            createdAt >= startOfDay &&
            createdAt <= endOfDay
        )
        .map(({ member, createdAt }) => ({
          id: member.id,
          createdAt: createdAt ?? new Date(0),
          userImage: member.image ?? "",
          userName: getUserName(member),
        })),
    };

    return { data };
  } catch (error) {
    return { error };
  }
};
