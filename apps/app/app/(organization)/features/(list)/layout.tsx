import { PortalRole } from "@repo/backend/auth";
import { getUserName } from "@repo/backend/auth/format";
import {
  currentMembers,
  currentOrganizationId,
  currentUser,
} from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { formatDate } from "@repo/lib/format";
import { desc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { Header } from "@/components/header";
import { FeatureCreateDropdown } from "../components/feature-create-dropdown";
import { FeaturesDragProvider } from "../components/features-drag-provider";
import { ProductsList } from "../components/products-list";

type FeatureListLayoutProperties = {
  readonly children: ReactNode;
};

const FeatureListLayout = async ({ children }: FeatureListLayoutProperties) => {
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    notFound();
  }

  const [organization, products, features, members] = await Promise.all([
    database
      .select({ id: tables.organization.id })
      .from(tables.organization)
      .where(eq(tables.organization.id, organizationId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    database
      .select({
        id: tables.product.id,
        name: tables.product.name,
        emoji: tables.product.emoji,
        createdAt: tables.product.createdAt,
      })
      .from(tables.product)
      .where(eq(tables.product.organizationId, organizationId))
      .orderBy(desc(tables.product.createdAt)),
    database
      .select({
        id: tables.feature.id,
        title: tables.feature.title,
        startAt: tables.feature.startAt,
        endAt: tables.feature.endAt,
        ownerId: tables.feature.ownerId,
        createdAt: tables.feature.createdAt,
      })
      .from(tables.feature)
      .where(eq(tables.feature.organizationId, organizationId)),
    currentMembers(),
  ]);

  if (!organization) {
    notFound();
  }

  const productIds = products.map((product) => product.id);
  const groups = productIds.length
    ? await database
        .select({
          id: tables.group.id,
          name: tables.group.name,
          emoji: tables.group.emoji,
          parentGroupId: tables.group.parentGroupId,
          productId: tables.group.productId,
        })
        .from(tables.group)
        .where(inArray(tables.group.productId, productIds))
    : [];

  const productsWithGroups = products.map((product) => ({
    ...product,
    groups: groups.filter((group) => group.productId === product.id),
  }));

  const promises = features.map(async (properties) => {
    const owner = properties.ownerId
      ? members.find(({ id }) => id === properties.ownerId)
      : null;
    return {
      ...properties,
      text: `Created ${formatDate(new Date(properties.createdAt))}`,
      owner: owner
        ? {
            name: getUserName(owner),
            email: owner.email ?? undefined,
            imageUrl: owner.image ?? undefined,
          }
        : null,
    };
  });

  const modifiedFeatures = await Promise.all(promises);

  const role = user.organizationRole ?? PortalRole.Member;

  return (
    <FeaturesDragProvider
      features={modifiedFeatures}
      products={productsWithGroups}
    >
      <div className="flex min-w-0 flex-1">
        <aside className="sticky top-0 h-screen w-72 shrink-0 overflow-auto border-r">
          <div className="h-full">
            <Header badge={productsWithGroups.length} title="Products">
              {role === PortalRole.Member ? null : (
                <FeatureCreateDropdown
                  hasProducts={productsWithGroups.length > 0}
                />
              )}
            </Header>
            <Suspense fallback={null}>
              <ProductsList products={productsWithGroups} role={role} />
            </Suspense>
          </div>
        </aside>
        <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </FeaturesDragProvider>
  );
};

export default FeatureListLayout;
