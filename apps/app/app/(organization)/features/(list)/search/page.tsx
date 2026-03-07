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
import { and, count, eq, ilike } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { FeatureCursor } from "@/actions/feature/list";
import { getFeatures } from "@/actions/feature/list";
import { FeaturesList } from "@/app/(organization)/features/components/features-list";
import { database } from "@/lib/database";
import { createMetadata } from "@/lib/metadata";
import { toMemberInfoList } from "@/lib/serialization";

type FeatureSeachPageProperties = {
  readonly searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export const metadata: Metadata = createMetadata({
  title: "Features",
  description: "Create and manage features for your product.",
});

const FeatureProduct = async (props: FeatureSeachPageProperties) => {
  const searchParams = await props.searchParams;
  const [user, organizationId, members] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
    currentMembers(),
  ]);
  const membersLite = toMemberInfoList(members);
  const queryClient = new QueryClient();

  if (!(user && organizationId)) {
    notFound();
  }

  if (typeof searchParams?.query !== "string") {
    redirect("/features");
  }

  const query = { search: searchParams.query };

  const [totalCount, databaseOrganization] = await Promise.all([
    database
      .select({ count: count() })
      .from(tables.feature)
      .where(
        and(
          eq(tables.feature.organizationId, organizationId),
          ilike(tables.feature.title, `%${searchParams.query}%`)
        )
      )
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

  if (!databaseOrganization) {
    notFound();
  }

  const role = user.organizationRole ?? PortalRole.Member;

  return (
    <div className="h-full overflow-y-auto">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <FeaturesList
          breadcrumbs={[{ href: "/features", text: "Features" }]}
          count={totalCount}
          editable={role !== PortalRole.Member}
          groups={databaseOrganization.groups}
          members={membersLite}
          products={databaseOrganization.products}
          query={query}
          releases={databaseOrganization.releases}
          role={role}
          statuses={databaseOrganization.featureStatuses}
          title={searchParams?.query}
        />
      </HydrationBoundary>
    </div>
  );
};

export default FeatureProduct;
