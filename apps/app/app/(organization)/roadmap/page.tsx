import { PortalRole } from "@repo/backend/auth";
import {
  currentMembers,
  currentOrganizationId,
  currentUser,
} from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { createMetadata } from "@repo/lib/metadata";
import { and, asc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toMemberInfoList } from "@/lib/serialization";
import {
  RoadmapEditor,
  type RoadmapEditorProperties,
} from "./components/roadmap-editor";

export const metadata: Metadata = createMetadata({
  title: "Gantt",
  description: "See a gantt chart of your organization’s features.",
});

const Roadmap = async () => {
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    notFound();
  }

  const [allFeatures, featureRows, roadmapEvents, members, organizationRows] =
    await Promise.all([
      database
        .select({
          id: tables.feature.id,
          title: tables.feature.title,
          statusColor: tables.featureStatus.color,
        })
        .from(tables.feature)
        .innerJoin(
          tables.featureStatus,
          eq(tables.feature.statusId, tables.featureStatus.id)
        )
        .where(
          and(
            eq(tables.feature.organizationId, organizationId),
            isNull(tables.feature.startAt),
            isNull(tables.feature.endAt)
          )
        ),
      database
        .select({
          id: tables.feature.id,
          title: tables.feature.title,
          startAt: tables.feature.startAt,
          endAt: tables.feature.endAt,
          ownerId: tables.feature.ownerId,
          statusId: tables.featureStatus.id,
          statusName: tables.featureStatus.name,
          statusOrder: tables.featureStatus.order,
          statusComplete: tables.featureStatus.complete,
          statusColor: tables.featureStatus.color,
          groupId: tables.group.id,
          groupName: tables.group.name,
          productId: tables.product.id,
          productName: tables.product.name,
          releaseId: tables.release.id,
          releaseTitle: tables.release.title,
          content: tables.feature.content,
        })
        .from(tables.feature)
        .innerJoin(
          tables.featureStatus,
          eq(tables.feature.statusId, tables.featureStatus.id)
        )
        .leftJoin(tables.group, eq(tables.feature.groupId, tables.group.id))
        .leftJoin(
          tables.product,
          eq(tables.feature.productId, tables.product.id)
        )
        .leftJoin(
          tables.release,
          eq(tables.feature.releaseId, tables.release.id)
        )
        .where(
          and(
            eq(tables.feature.organizationId, organizationId),
            isNotNull(tables.feature.startAt)
          )
        )
        .orderBy(asc(tables.feature.startAt)),
      database
        .select({
          id: tables.roadmapEvent.id,
          text: tables.roadmapEvent.text,
          date: tables.roadmapEvent.date,
        })
        .from(tables.roadmapEvent)
        .where(eq(tables.roadmapEvent.organizationId, organizationId)),
      currentMembers(),
      database
        .select({ id: tables.organization.id })
        .from(tables.organization)
        .where(eq(tables.organization.id, organizationId))
        .limit(1),
    ]);
  const membersLite = toMemberInfoList(members);

  const organization = organizationRows[0];

  const featureIds = featureRows.map((feature) => feature.id);
  const initiativeRows =
    featureIds.length === 0
      ? []
      : await database
          .select({
            featureId: tables.featureToInitiative.a,
            id: tables.initiative.id,
            title: tables.initiative.title,
          })
          .from(tables.featureToInitiative)
          .innerJoin(
            tables.initiative,
            eq(tables.initiative.id, tables.featureToInitiative.b)
          )
          .where(inArray(tables.featureToInitiative.a, featureIds));

  const initiativesByFeature = new Map<
    string,
    { id: string; title: string }[]
  >();

  for (const row of initiativeRows) {
    const existing = initiativesByFeature.get(row.featureId) ?? [];
    existing.push({ id: row.id, title: row.title });
    initiativesByFeature.set(row.featureId, existing);
  }

  const modifiedFeatures: RoadmapEditorProperties["features"] = featureRows.map(
    (feature) => ({
      id: feature.id,
      title: feature.title,
      startAt: feature.startAt ? new Date(feature.startAt) : new Date(),
      endAt: feature.endAt ? new Date(feature.endAt) : null,
      ownerId: feature.ownerId,
      status: {
        id: feature.statusId,
        name: feature.statusName,
        order: feature.statusOrder,
        complete: feature.statusComplete,
        color: feature.statusColor,
      },
      group: feature.groupId
        ? { id: feature.groupId, name: feature.groupName ?? "" }
        : null,
      product: feature.productId
        ? { id: feature.productId, name: feature.productName ?? "" }
        : null,
      release: feature.releaseId
        ? { id: feature.releaseId, title: feature.releaseTitle ?? "" }
        : null,
      initiatives: initiativesByFeature.get(feature.id) ?? [],
      content: feature.content,
    })
  );

  if (!organization) {
    notFound();
  }

  return (
    <RoadmapEditor
      allFeatures={allFeatures.map((feature) => ({
        id: feature.id,
        title: feature.title,
        status: { color: feature.statusColor },
      }))}
      editable={user.organizationRole !== PortalRole.Member}
      features={modifiedFeatures}
      markers={roadmapEvents.map((event) => ({
        ...event,
        date: new Date(event.date),
      }))}
      members={membersLite}
    />
  );
};

export default Roadmap;
