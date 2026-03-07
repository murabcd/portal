import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { createMetadata } from "@repo/lib/metadata";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import type { Metadata } from "next";
import { Calendar } from "./components/calendar";

export const metadata: Metadata = createMetadata({
  title: "Calendar",
  description: "See a calendar view of your organization’s features.",
});

const Roadmap = async () => {
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return <div />;
  }

  const features = await database
    .select({
      id: tables.feature.id,
      title: tables.feature.title,
      startAt: tables.feature.startAt,
      endAt: tables.feature.endAt,
      statusId: tables.featureStatus.id,
      statusName: tables.featureStatus.name,
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
        isNotNull(tables.feature.startAt)
      )
    )
    .orderBy(asc(tables.feature.startAt));

  return (
    <Calendar
      features={features.map((feature) => ({
        endAt: feature.endAt ? new Date(feature.endAt) : new Date(),
        id: feature.id,
        name: feature.title,
        startAt: feature.startAt ? new Date(feature.startAt) : new Date(),
        status: {
          color: feature.statusColor,
          id: feature.statusId,
          name: feature.statusName,
        },
      }))}
    />
  );
};

export default Roadmap;
