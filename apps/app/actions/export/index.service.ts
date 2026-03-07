import "server-only";

import { database, tables } from "@repo/backend/database";
import { asc, eq } from "drizzle-orm";
import { generateCsv } from "@/lib/csv";

const toIso = (value: Date | string | null | undefined) =>
  value ? new Date(value).toISOString() : "";

export const exportAll = async (): Promise<
  { data: Record<string, string> } | { error: string }
> => {
  try {
    const [
      features,
      feedback,
      feedbackUsers,
      feedbackAnalyses,
      feedbackOrganizations,
      feedbackFeatureLinks,
      initiatives,
      initiativeMembers,
      initiativePages,
      initiativeCanvases,
      initiativeUpdates,
      initiativeFiles,
      initiativeExternalLinks,
      changelogs,
      changelogContributors,
      changelogTags,
      releases,
      products,
      groups,
      featureStatuses,
      featureConnections,
      featureRice,
      aiFeatureRice,
      featureDrivers,
      featureAssignments,
      featureAssignmentRoles,
      featureCustomFields,
      featureCustomFieldValues,
      tags,
      drivers,
      digests,
      roadmapEvents,
      templates,
      apiKeys,
      atlassianInstallations,
      installationStatusMappings,
      installationFieldMappings,
      installationStates,
      featureToTag,
      featureToInitiative,
      feedbackToTag,
      changelogToChangelogTag,
      groupToInitiative,
      initiativeToProduct,
    ] = await Promise.all([
      database
        .select({
          id: tables.feature.id,
          title: tables.feature.title,
          statusName: tables.featureStatus.name,
          productName: tables.product.name,
          groupName: tables.group.name,
          ownerId: tables.feature.ownerId,
          startAt: tables.feature.startAt,
          endAt: tables.feature.endAt,
          source: tables.feature.source,
          createdAt: tables.feature.createdAt,
          updatedAt: tables.feature.updatedAt,
        })
        .from(tables.feature)
        .innerJoin(
          tables.featureStatus,
          eq(tables.feature.statusId, tables.featureStatus.id)
        )
        .leftJoin(
          tables.product,
          eq(tables.feature.productId, tables.product.id)
        )
        .leftJoin(tables.group, eq(tables.feature.groupId, tables.group.id)),
      database
        .select({
          id: tables.feedback.id,
          title: tables.feedback.title,
          aiSentiment: tables.feedback.aiSentiment,
          source: tables.feedback.source,
          createdAt: tables.feedback.createdAt,
          feedbackUserName: tables.feedbackUser.name,
          feedbackUserEmail: tables.feedbackUser.email,
        })
        .from(tables.feedback)
        .leftJoin(
          tables.feedbackUser,
          eq(tables.feedback.feedbackUserId, tables.feedbackUser.id)
        ),
      database.select().from(tables.feedbackUser),
      database.select().from(tables.feedbackAnalysis),
      database.select().from(tables.feedbackOrganization),
      database.select().from(tables.feedbackFeatureLink),
      database.select().from(tables.initiative),
      database.select().from(tables.initiativeMember),
      database.select().from(tables.initiativePage),
      database.select().from(tables.initiativeCanvas),
      database.select().from(tables.initiativeUpdate),
      database.select().from(tables.initiativeFile),
      database.select().from(tables.initiativeExternalLink),
      database.select().from(tables.changelog),
      database.select().from(tables.changelogContributor),
      database.select().from(tables.changelogTag),
      database.select().from(tables.release),
      database.select().from(tables.product),
      database
        .select({
          id: tables.group.id,
          name: tables.group.name,
          emoji: tables.group.emoji,
          ownerId: tables.group.ownerId,
          createdAt: tables.group.createdAt,
          updatedAt: tables.group.updatedAt,
          productName: tables.product.name,
        })
        .from(tables.group)
        .leftJoin(
          tables.product,
          eq(tables.group.productId, tables.product.id)
        ),
      database
        .select()
        .from(tables.featureStatus)
        .orderBy(asc(tables.featureStatus.order)),
      database.select().from(tables.featureConnection),
      database.select().from(tables.featureRice),
      database.select().from(tables.aiFeatureRice),
      database.select().from(tables.featureDriver),
      database.select().from(tables.featureAssignment),
      database.select().from(tables.featureAssignmentRole),
      database.select().from(tables.featureCustomField),
      database.select().from(tables.featureCustomFieldValue),
      database.select().from(tables.tag),
      database.select().from(tables.driver),
      database.select().from(tables.digest),
      database.select().from(tables.roadmapEvent),
      database.select().from(tables.template),
      database
        .select({
          id: tables.apiKey.id,
          name: tables.apiKey.name,
          creatorId: tables.apiKey.creatorId,
          createdAt: tables.apiKey.createdAt,
          updatedAt: tables.apiKey.updatedAt,
        })
        .from(tables.apiKey),
      database
        .select({
          id: tables.atlassianInstallation.id,
          email: tables.atlassianInstallation.email,
          siteUrl: tables.atlassianInstallation.siteUrl,
          creatorId: tables.atlassianInstallation.creatorId,
          createdAt: tables.atlassianInstallation.createdAt,
        })
        .from(tables.atlassianInstallation),
      database.select().from(tables.installationStatusMapping),
      database.select().from(tables.installationFieldMapping),
      database.select().from(tables.installationState),
      database.select().from(tables.featureToTag),
      database.select().from(tables.featureToInitiative),
      database.select().from(tables.feedbackToTag),
      database.select().from(tables.changelogToChangelogTag),
      database.select().from(tables.groupToInitiative),
      database.select().from(tables.initiativeToProduct),
    ]);

    const data: Record<string, string> = {
      // Core entities
      "features.csv": generateCsv(
        [
          "id",
          "title",
          "status",
          "product",
          "group",
          "ownerId",
          "startAt",
          "endAt",
          "source",
          "createdAt",
          "updatedAt",
        ],
        features.map((f) => [
          f.id,
          f.title,
          f.statusName,
          f.productName ?? "",
          f.groupName ?? "",
          f.ownerId,
          toIso(f.startAt),
          toIso(f.endAt),
          f.source,
          toIso(f.createdAt),
          toIso(f.updatedAt),
        ])
      ),
      "feedback.csv": generateCsv(
        [
          "id",
          "title",
          "sentiment",
          "source",
          "userName",
          "userEmail",
          "createdAt",
        ],
        feedback.map((f) => [
          f.id,
          f.title,
          f.aiSentiment ?? "",
          f.source,
          f.feedbackUserName ?? "",
          f.feedbackUserEmail ?? "",
          toIso(f.createdAt),
        ])
      ),
      "feedback-users.csv": generateCsv(
        ["id", "name", "email", "role", "source", "createdAt", "updatedAt"],
        feedbackUsers.map((u) => [
          u.id,
          u.name,
          u.email,
          u.role ?? "",
          u.source,
          toIso(u.createdAt),
          toIso(u.updatedAt),
        ])
      ),
      "feedback-analyses.csv": generateCsv(
        [
          "id",
          "feedbackId",
          "summary",
          "outcomes",
          "painPoints",
          "recommendations",
          "createdAt",
        ],
        feedbackAnalyses.map((a) => [
          a.id,
          a.feedbackId,
          a.summary ?? "",
          a.outcomes ?? "",
          a.painPoints ?? "",
          a.recommendations ?? "",
          toIso(a.createdAt),
        ])
      ),
      "feedback-organizations.csv": generateCsv(
        ["id", "name", "domain", "source", "createdAt", "updatedAt"],
        feedbackOrganizations.map((o) => [
          o.id,
          o.name,
          o.domain ?? "",
          o.source,
          toIso(o.createdAt),
          toIso(o.updatedAt),
        ])
      ),
      "feedback-feature-links.csv": generateCsv(
        ["id", "feedbackId", "featureId", "creatorId", "createdAt"],
        feedbackFeatureLinks.map((l) => [
          l.id,
          l.feedbackId,
          l.featureId,
          l.creatorId ?? "",
          toIso(l.createdAt),
        ])
      ),
      "initiatives.csv": generateCsv(
        ["id", "title", "state", "ownerId", "emoji", "createdAt", "updatedAt"],
        initiatives.map((i) => [
          i.id,
          i.title,
          i.state,
          i.ownerId,
          i.emoji,
          toIso(i.createdAt),
          toIso(i.updatedAt),
        ])
      ),
      "initiative-members.csv": generateCsv(
        ["id", "initiativeId", "userId", "creatorId", "createdAt"],
        initiativeMembers.map((m) => [
          m.id,
          m.initiativeId,
          m.userId,
          m.creatorId,
          toIso(m.createdAt),
        ])
      ),
      "initiative-pages.csv": generateCsv(
        [
          "id",
          "initiativeId",
          "title",
          "default",
          "creatorId",
          "createdAt",
          "updatedAt",
        ],
        initiativePages.map((p) => [
          p.id,
          p.initiativeId,
          p.title,
          p.default,
          p.creatorId,
          toIso(p.createdAt),
          toIso(p.updatedAt),
        ])
      ),
      "initiative-canvases.csv": generateCsv(
        ["id", "initiativeId", "title", "creatorId", "createdAt", "updatedAt"],
        initiativeCanvases.map((c) => [
          c.id,
          c.initiativeId,
          c.title,
          c.creatorId,
          toIso(c.createdAt),
          toIso(c.updatedAt),
        ])
      ),
      "initiative-updates.csv": generateCsv(
        [
          "id",
          "initiativeId",
          "title",
          "creatorId",
          "sendEmail",
          "sendSlack",
          "emailSentAt",
          "slackSentAt",
          "createdAt",
        ],
        initiativeUpdates.map((u) => [
          u.id,
          u.initiativeId,
          u.title,
          u.creatorId,
          u.sendEmail,
          u.sendSlack,
          toIso(u.emailSentAt),
          toIso(u.slackSentAt),
          toIso(u.createdAt),
        ])
      ),
      "initiative-files.csv": generateCsv(
        ["id", "initiativeId", "name", "url", "creatorId", "createdAt"],
        initiativeFiles.map((f) => [
          f.id,
          f.initiativeId,
          f.name,
          f.url,
          f.creatorId,
          toIso(f.createdAt),
        ])
      ),
      "initiative-external-links.csv": generateCsv(
        ["id", "initiativeId", "title", "href", "creatorId", "createdAt"],
        initiativeExternalLinks.map((l) => [
          l.id,
          l.initiativeId,
          l.title,
          l.href,
          l.creatorId,
          toIso(l.createdAt),
        ])
      ),
      "changelogs.csv": generateCsv(
        ["id", "title", "status", "slug", "publishAt", "createdAt"],
        changelogs.map((c) => [
          c.id,
          c.title,
          c.status,
          c.slug ?? "",
          toIso(c.publishAt),
          toIso(c.createdAt),
        ])
      ),
      "changelog-contributors.csv": generateCsv(
        ["id", "changelogId", "userId", "createdAt"],
        changelogContributors.map((c) => [
          c.id,
          c.changelogId,
          c.userId,
          toIso(c.createdAt),
        ])
      ),
      "changelog-tags.csv": generateCsv(
        ["id", "name", "createdAt", "updatedAt"],
        changelogTags.map((t) => [
          t.id,
          t.name,
          toIso(t.createdAt),
          toIso(t.updatedAt),
        ])
      ),
      "releases.csv": generateCsv(
        [
          "id",
          "title",
          "description",
          "state",
          "startAt",
          "endAt",
          "createdAt",
        ],
        releases.map((r) => [
          r.id,
          r.title,
          r.description ?? "",
          r.state,
          toIso(r.startAt),
          toIso(r.endAt),
          toIso(r.createdAt),
        ])
      ),
      "products.csv": generateCsv(
        ["id", "name", "emoji", "ownerId", "createdAt", "updatedAt"],
        products.map((p) => [
          p.id,
          p.name,
          p.emoji,
          p.ownerId ?? "",
          toIso(p.createdAt),
          toIso(p.updatedAt),
        ])
      ),
      "groups.csv": generateCsv(
        ["id", "name", "emoji", "product", "ownerId", "createdAt", "updatedAt"],
        groups.map((g) => [
          g.id,
          g.name,
          g.emoji,
          g.productName ?? "",
          g.ownerId ?? "",
          toIso(g.createdAt),
          toIso(g.updatedAt),
        ])
      ),
      "feature-statuses.csv": generateCsv(
        ["id", "name", "color", "order", "complete", "createdAt", "updatedAt"],
        featureStatuses.map((s) => [
          s.id,
          s.name,
          s.color,
          s.order,
          s.complete,
          toIso(s.createdAt),
          toIso(s.updatedAt),
        ])
      ),
      "feature-connections.csv": generateCsv(
        ["id", "featureId", "type", "externalId", "href", "createdAt"],
        featureConnections.map((c) => [
          c.id,
          c.featureId,
          c.type,
          c.externalId,
          c.href,
          toIso(c.createdAt),
        ])
      ),
      "feature-rice.csv": generateCsv(
        [
          "id",
          "featureId",
          "reach",
          "impact",
          "confidence",
          "effort",
          "createdAt",
        ],
        featureRice.map((r) => [
          r.id,
          r.featureId,
          r.reach,
          r.impact,
          r.confidence,
          r.effort,
          toIso(r.createdAt),
        ])
      ),
      "ai-feature-rice.csv": generateCsv(
        [
          "id",
          "featureId",
          "reach",
          "impact",
          "confidence",
          "effort",
          "reachReason",
          "impactReason",
          "confidenceReason",
          "effortReason",
          "createdAt",
        ],
        aiFeatureRice.map((r) => [
          r.id,
          r.featureId,
          r.reach,
          r.impact,
          r.confidence,
          r.effort,
          r.reachReason,
          r.impactReason,
          r.confidenceReason,
          r.effortReason,
          toIso(r.createdAt),
        ])
      ),
      "feature-drivers.csv": generateCsv(
        ["id", "featureId", "driverId", "value", "createdAt"],
        featureDrivers.map((d) => [
          d.id,
          d.featureId,
          d.driverId,
          d.value,
          toIso(d.createdAt),
        ])
      ),
      "feature-assignments.csv": generateCsv(
        ["id", "featureId", "userId", "roleId", "createdAt"],
        featureAssignments.map((a) => [
          a.id,
          a.featureId,
          a.userId,
          a.roleId,
          toIso(a.createdAt),
        ])
      ),
      "feature-assignment-roles.csv": generateCsv(
        ["id", "name", "description", "createdAt", "updatedAt"],
        featureAssignmentRoles.map((r) => [
          r.id,
          r.name,
          r.description,
          toIso(r.createdAt),
          toIso(r.updatedAt),
        ])
      ),
      "feature-custom-fields.csv": generateCsv(
        ["id", "name", "description", "createdAt", "updatedAt"],
        featureCustomFields.map((f) => [
          f.id,
          f.name,
          f.description ?? "",
          toIso(f.createdAt),
          toIso(f.updatedAt),
        ])
      ),
      "feature-custom-field-values.csv": generateCsv(
        ["id", "featureId", "customFieldId", "value", "createdAt", "updatedAt"],
        featureCustomFieldValues.map((v) => [
          v.id,
          v.featureId,
          v.customFieldId,
          v.value,
          toIso(v.createdAt),
          toIso(v.updatedAt),
        ])
      ),
      "tags.csv": generateCsv(
        ["id", "name", "slug", "description", "createdAt", "updatedAt"],
        tags.map((t) => [
          t.id,
          t.name,
          t.slug,
          t.description ?? "",
          toIso(t.createdAt),
          toIso(t.updatedAt),
        ])
      ),
      "drivers.csv": generateCsv(
        ["id", "name", "description", "color", "createdAt", "updatedAt"],
        drivers.map((d) => [
          d.id,
          d.name,
          d.description,
          d.color,
          toIso(d.createdAt),
          toIso(d.updatedAt),
        ])
      ),
      "digests.csv": generateCsv(
        ["id", "text", "summary", "createdAt", "updatedAt"],
        digests.map((d) => [
          d.id,
          d.text,
          d.summary,
          toIso(d.createdAt),
          toIso(d.updatedAt),
        ])
      ),

      // Misc
      "roadmap-events.csv": generateCsv(
        ["id", "text", "date", "creatorId", "createdAt", "updatedAt"],
        roadmapEvents.map((e) => [
          e.id,
          e.text,
          toIso(e.date),
          e.creatorId,
          toIso(e.createdAt),
          toIso(e.updatedAt),
        ])
      ),
      "templates.csv": generateCsv(
        ["id", "title", "description", "creatorId", "createdAt", "updatedAt"],
        templates.map((t) => [
          t.id,
          t.title,
          t.description ?? "",
          t.creatorId,
          toIso(t.createdAt),
          toIso(t.updatedAt),
        ])
      ),
      "api-keys.csv": generateCsv(
        ["id", "name", "creatorId", "createdAt", "updatedAt"],
        apiKeys.map((k) => [
          k.id,
          k.name,
          k.creatorId,
          toIso(k.createdAt),
          toIso(k.updatedAt),
        ])
      ),

      // Installations (secrets excluded)
      "atlassian-installations.csv": generateCsv(
        ["id", "email", "siteUrl", "creatorId", "createdAt"],
        atlassianInstallations.map((i) => [
          i.id,
          i.email,
          i.siteUrl,
          i.creatorId,
          toIso(i.createdAt),
        ])
      ),
      "installation-status-mappings.csv": generateCsv(
        [
          "id",
          "type",
          "featureStatusId",
          "eventType",
          "eventId",
          "creatorId",
          "createdAt",
        ],
        installationStatusMappings.map((m) => [
          m.id,
          m.type,
          m.featureStatusId,
          m.eventType,
          m.eventId ?? "",
          m.creatorId,
          toIso(m.createdAt),
        ])
      ),
      "installation-field-mappings.csv": generateCsv(
        [
          "id",
          "type",
          "externalId",
          "internalId",
          "externalType",
          "internalType",
          "creatorId",
          "createdAt",
        ],
        installationFieldMappings.map((m) => [
          m.id,
          m.type,
          m.externalId,
          m.internalId,
          m.externalType,
          m.internalType,
          m.creatorId,
          toIso(m.createdAt),
        ])
      ),
      "installation-states.csv": generateCsv(
        ["id", "platform", "creatorId", "createdAt"],
        installationStates.map((s) => [
          s.id,
          s.platform,
          s.creatorId,
          toIso(s.createdAt),
        ])
      ),

      // Many-to-many join tables (derived from includes)
      "feature-to-tag.csv": generateCsv(
        ["featureId", "tagId"],
        featureToTag.map((row) => [row.a, row.b])
      ),
      "feature-to-initiative.csv": generateCsv(
        ["featureId", "initiativeId"],
        featureToInitiative.map((row) => [row.a, row.b])
      ),
      "feedback-to-tag.csv": generateCsv(
        ["feedbackId", "tagId"],
        feedbackToTag.map((row) => [row.a, row.b])
      ),
      "changelog-to-changelog-tag.csv": generateCsv(
        ["changelogId", "changelogTagId"],
        changelogToChangelogTag.map((row) => [row.a, row.b])
      ),
      "group-to-initiative.csv": generateCsv(
        ["groupId", "initiativeId"],
        groupToInitiative.map((row) => [row.a, row.b])
      ),
      "initiative-to-product.csv": generateCsv(
        ["initiativeId", "productId"],
        initiativeToProduct.map((row) => [row.a, row.b])
      ),
    };

    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
};
