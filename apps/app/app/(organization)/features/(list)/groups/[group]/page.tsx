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
import { count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { FeatureCursor } from "@/actions/feature/list";
import { getFeatures } from "@/actions/feature/list";
import { FeaturesEmptyState } from "@/app/(organization)/features/components/features-empty-state";
import { FeaturesList } from "@/app/(organization)/features/components/features-list";
import { database } from "@/lib/database";
import { createMetadata } from "@/lib/metadata";
import { toMemberInfoList } from "@/lib/serialization";

type FeatureGroupPageProperties = {
  readonly params: Promise<{
    readonly group: string;
  }>;
};

export const metadata: Metadata = createMetadata({
  title: "Features",
  description: "Create and manage features for your product.",
});

const FeatureGroup = async (props: FeatureGroupPageProperties) => {
  const params = await props.params;
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
  const query = { groupId: params.group };

  const [totalCount, databaseOrganization, group] = await Promise.all([
    database
      .select({ count: count() })
      .from(tables.feature)
      .where(eq(tables.feature.groupId, params.group))
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
    database
      .select({
        name: tables.group.name,
        parentGroupId: tables.group.parentGroupId,
        productId: tables.group.productId,
        productName: tables.product.name,
      })
      .from(tables.group)
      .leftJoin(tables.product, eq(tables.group.productId, tables.product.id))
      .where(eq(tables.group.id, params.group))
      .limit(1)
      .then((rows) => rows[0] ?? null),
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

  if (!(databaseOrganization && group)) {
    notFound();
  }

  const breadcrumbs = [{ href: "/features", text: "Features" }];

  if (group.productId) {
    breadcrumbs.push({
      href: `/features/products/${group.productId}`,
      text: group.productName ?? "Product",
    });
  }

  let parent = group.parentGroupId;

  while (parent) {
    const parentGroup = await database
      .select({
        name: tables.group.name,
        parentGroupId: tables.group.parentGroupId,
      })
      .from(tables.group)
      .where(eq(tables.group.id, parent))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!parentGroup) {
      parent = null;
      break;
    }

    breadcrumbs.push({
      href: `/features/groups/${parent}`,
      text: parentGroup.name,
    });

    parent = parentGroup.parentGroupId;
  }

  const role = user.organizationRole ?? PortalRole.Member;

  return (
    <div className="h-full overflow-y-auto">
      {totalCount ? (
        <HydrationBoundary state={dehydrate(queryClient)}>
          <FeaturesList
            breadcrumbs={breadcrumbs}
            count={totalCount}
            editable={role !== PortalRole.Member}
            groups={databaseOrganization.groups}
            members={membersLite}
            products={databaseOrganization.products}
            query={query}
            releases={databaseOrganization.releases}
            role={role}
            statuses={databaseOrganization.featureStatuses}
            title={group.name ?? "Group"}
          />
        </HydrationBoundary>
      ) : (
        <FeaturesEmptyState
          groupId={params.group}
          productId={group.productId ?? undefined}
          role={role}
        />
      )}
    </div>
  );
};

export default FeatureGroup;
