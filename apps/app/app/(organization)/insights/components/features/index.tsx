import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { Skeleton } from "@repo/design-system/components/precomposed/skeleton";
import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FeaturesEmptyState } from "@/app/(organization)/features/components/features-empty-state";
import { AssignedFeatures } from "./assigned-features";
import { OwnersChart } from "./owners-chart";
import { StatusesChart } from "./statuses-chart";
import { FeaturesTrend } from "./trend";

export const FeaturesSection = async () => {
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    notFound();
  }

  const featuresCount =
    (await database
      .select({ count: sql<number>`count(*)` })
      .from(tables.feature)
      .where(eq(tables.feature.organizationId, organizationId))
      .then((rows) => rows[0]?.count ?? 0)) ?? 0;

  const role =
    user.organizationRole === PortalRole.Admin ||
    user.organizationRole === PortalRole.Editor ||
    user.organizationRole === PortalRole.Member
      ? user.organizationRole
      : PortalRole.Member;

  if (featuresCount === 0) {
    return (
      <div className="p-16">
        <FeaturesEmptyState role={role} />
      </div>
    );
  }

  return (
    <section className="space-y-4 p-4 sm:p-8">
      <div>
        <p className="font-medium text-sm">Features</p>
        <Suspense fallback={<Skeleton className="h-5 w-64" />}>
          <FeaturesTrend />
        </Suspense>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-[431px] w-full" />}>
          <StatusesChart />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-[431px] w-full" />}>
          <OwnersChart />
        </Suspense>
        <div className="sm:col-span-2">
          <Suspense fallback={<Skeleton className="h-[433px] w-full" />}>
            <AssignedFeatures />
          </Suspense>
        </div>
      </div>
    </section>
  );
};
