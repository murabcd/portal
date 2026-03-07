import { PortalRole } from "@repo/backend/auth";
import {
  currentMembers,
  currentOrganizationId,
  currentUser,
} from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { FeatureCursor } from "@/actions/feature/list";
import { getFeatures } from "@/actions/feature/list";
import { database } from "@/lib/database";
import { createMetadata } from "@/lib/metadata";
import { toMemberInfoList } from "@/lib/serialization";
import { FeaturesEmptyState } from "../components/features-empty-state";
import { FeaturesList } from "../components/features-list";

export const metadata: Metadata = createMetadata({
  title: "Features",
  description: "Create and manage features for your product.",
});

const FeaturesIndex = async () => {
  const [user, organizationId, members] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
    currentMembers(),
  ]);
  const membersLite = toMemberInfoList(members);

  if (!(user && organizationId)) {
    return notFound();
  }

  const queryClient = new QueryClient();
  const query = {};

  const [countResult, databaseOrganization] = await Promise.all([
    database
      .select({ count: sql<number>`count(*)` })
      .from(tables.feature)
      .where(eq(tables.feature.organizationId, organizationId))
      .then((rows) => rows[0]?.count ?? 0),
    Promise.all([
      database
        .select({
          id: tables.featureStatus.id,
          name: tables.featureStatus.name,
          color: tables.featureStatus.color,
          order: tables.featureStatus.order,
        })
        .from(tables.featureStatus)
        .where(eq(tables.featureStatus.organizationId, organizationId)),
      database
        .select({
          id: tables.product.id,
          name: tables.product.name,
          emoji: tables.product.emoji,
        })
        .from(tables.product)
        .where(eq(tables.product.organizationId, organizationId)),
      database
        .select({
          id: tables.group.id,
          name: tables.group.name,
          emoji: tables.group.emoji,
          productId: tables.group.productId,
          parentGroupId: tables.group.parentGroupId,
        })
        .from(tables.group)
        .where(eq(tables.group.organizationId, organizationId)),
      database
        .select({
          id: tables.release.id,
          title: tables.release.title,
        })
        .from(tables.release)
        .where(eq(tables.release.organizationId, organizationId)),
    ]).then(([featureStatuses, products, groups, releases]) => ({
      featureStatuses,
      products,
      groups,
      releases,
    })),
    queryClient.prefetchInfiniteQuery({
      queryKey: ["features", query],
      queryFn: async ({ pageParam }) => {
        const response = await getFeatures(pageParam, query);

        if ("error" in response) {
          throw response.error;
        }

        return response;
      },
      initialPageParam: null as FeatureCursor | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      pages: 1,
    }),
  ]);

  const count = countResult ?? 0;
  const role = user.organizationRole ?? PortalRole.Member;

  if (!(databaseOrganization && count)) {
    return <FeaturesEmptyState role={role} />;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={null}>
        <FeaturesList
          count={count}
          editable={role !== PortalRole.Member}
          groups={databaseOrganization.groups}
          members={membersLite}
          products={databaseOrganization.products}
          query={query}
          releases={databaseOrganization.releases}
          role={role}
          statuses={databaseOrganization.featureStatuses}
        />
      </Suspense>
    </HydrationBoundary>
  );
};

export default FeaturesIndex;
