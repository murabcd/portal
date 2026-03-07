import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { StackCard } from "@repo/design-system/components/stack-card";
import { createMetadata } from "@repo/lib/metadata";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreateStatusButton } from "./components/create-status-button";
import { FeatureStatusesList } from "./components/feature-statuses-list";

export const metadata: Metadata = createMetadata({
  title: "Customize feature statuses",
  description: "Customize feature statuses for your organization.",
});

const StatusesSettings = async () => {
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    notFound();
  }

  const statuses = await database
    .select({
      id: tables.featureStatus.id,
      name: tables.featureStatus.name,
      color: tables.featureStatus.color,
      complete: tables.featureStatus.complete,
    })
    .from(tables.featureStatus)
    .where(eq(tables.featureStatus.organizationId, organizationId))
    .orderBy(asc(tables.featureStatus.order));

  const statusIds = statuses.map((status) => status.id);

  const features =
    statusIds.length === 0
      ? []
      : await database
          .select({
            id: tables.feature.id,
            statusId: tables.feature.statusId,
          })
          .from(tables.feature)
          .where(
            and(
              inArray(tables.feature.statusId, statusIds),
              eq(tables.feature.organizationId, organizationId)
            )
          );

  const featuresByStatus = new Map<string, { id: string }[]>();

  for (const feature of features) {
    const existing = featuresByStatus.get(feature.statusId) ?? [];
    existing.push({ id: feature.id });
    featuresByStatus.set(feature.statusId, existing);
  }

  const statusesWithFeatures = statuses.map((status) => ({
    ...status,
    features: featuresByStatus.get(status.id) ?? [],
  }));

  return (
    <div className="px-6 py-16">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="m-0 font-semibold text-4xl tracking-tight">
              Statuses
            </h1>
            <p className="mt-2 mb-0 text-muted-foreground">
              Customize feature statuses for your organization.
            </p>
          </div>
          <CreateStatusButton />
        </div>
        <StackCard className="divide-y p-0">
          <div className="grid grid-cols-12 gap-8 py-3">
            <p className="col-span-4 pl-7 font-medium text-sm">Name</p>
            <p className="col-span-3 font-medium text-sm">Color</p>
            <p className="col-span-2 font-medium text-sm">Complete</p>
            <p className="col-span-2 font-medium text-sm">Features</p>
            <div />
          </div>
          <FeatureStatusesList initialStatuses={statusesWithFeatures} />
        </StackCard>
      </div>
    </div>
  );
};

export default StatusesSettings;
