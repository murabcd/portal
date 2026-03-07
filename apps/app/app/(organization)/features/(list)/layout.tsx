import { FlowniRole } from "@repo/backend/auth";
import { getUserName } from "@repo/backend/auth/format";
import {
  currentMembers,
  currentOrganizationId,
  currentUser,
} from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@repo/design-system/components/ui/resizable";
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

  const role = user.organizationRole ?? FlowniRole.Member;

  return (
    <FeaturesDragProvider
      features={modifiedFeatures}
      products={productsWithGroups}
    >
      <ResizablePanelGroup
        className="min-w-0 flex-1"
        direction="horizontal"
        style={{ overflow: "unset" }}
      >
        <ResizablePanel
          className="sticky top-0 h-screen min-w-72"
          defaultSize={20}
          maxSize={25}
          minSize={15}
          style={{ overflow: "auto" }}
        >
          <div className="h-full border-r">
            <Header badge={productsWithGroups.length} title="Products">
              {role === FlowniRole.Member ? null : (
                <FeatureCreateDropdown
                  hasProducts={productsWithGroups.length > 0}
                />
              )}
            </Header>
            <Suspense fallback={null}>
              <ProductsList products={productsWithGroups} role={role} />
            </Suspense>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          className="min-w-0"
          defaultSize={80}
          style={{ overflow: "unset" }}
        >
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </FeaturesDragProvider>
  );
};

export default FeatureListLayout;
