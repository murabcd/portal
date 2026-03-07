import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createMetadata } from "@/lib/metadata";
import { FeatureSidebar } from "./components/feature-sidebar";

type FeaturePageLayoutProperties = {
  readonly params: Promise<{
    readonly feature: string;
  }>;
  readonly children: ReactNode;
};

export const generateMetadata = async (
  props: FeaturePageLayoutProperties
): Promise<Metadata> => {
  const params = await props.params;
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return {};
  }

  const feature = await database
    .select({ title: tables.feature.title })
    .from(tables.feature)
    .where(
      and(
        eq(tables.feature.id, params.feature),
        eq(tables.feature.organizationId, organizationId)
      )
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!feature) {
    return {};
  }

  return createMetadata({
    title: feature.title,
    description: `Feature page for ${feature.title}`,
  });
};

const FeaturePageLayout = async (props: FeaturePageLayoutProperties) => {
  const params = await props.params;

  const { children } = props;

  return (
    <div className="flex h-full divide-x">
      {children}
      <FeatureSidebar featureId={params.feature} />
    </div>
  );
};

export default FeaturePageLayout;
