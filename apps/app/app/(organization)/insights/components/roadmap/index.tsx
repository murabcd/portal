import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { endOfQuarter, startOfQuarter } from "date-fns";
import { and, eq, gte, lte, or, sql } from "drizzle-orm";
import { Suspense } from "react";
import { RoadmapEmptyState } from "./empty-state";
import { QuarterlyRoadmap } from "./quarterly-roadmap";
import { RoadmapTrend } from "./trend";

export const RoadmapSection = async () => {
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return <div />;
  }

  const today = new Date();
  const quarterStart = startOfQuarter(today).toISOString();
  const quarterEnd = endOfQuarter(today).toISOString();

  const upcomingFeatures =
    (await database
      .select({ count: sql<number>`count(*)` })
      .from(tables.feature)
      .where(
        and(
          eq(tables.feature.organizationId, organizationId),
          or(
            and(
              lte(tables.feature.startAt, quarterEnd),
              gte(tables.feature.startAt, quarterStart)
            ),
            and(
              lte(tables.feature.endAt, quarterEnd),
              gte(tables.feature.endAt, quarterStart)
            ),
            and(
              lte(tables.feature.startAt, quarterStart),
              gte(tables.feature.endAt, quarterEnd)
            )
          )
        )
      )
      .then((rows) => rows[0]?.count)) ?? 0;

  if (upcomingFeatures === 0) {
    return (
      <div className="p-16">
        <RoadmapEmptyState />
      </div>
    );
  }

  return (
    <section className="space-y-4 p-4 sm:p-8">
      <div>
        <p className="font-medium text-sm">Roadmap</p>
        <Suspense fallback={null}>
          <RoadmapTrend />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <QuarterlyRoadmap />
      </Suspense>
    </section>
  );
};
