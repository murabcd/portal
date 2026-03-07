import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { createMetadata } from "@repo/lib/metadata";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AiIndexingChart } from "./components/ai-indexing-chart";

export const metadata: Metadata = createMetadata({
  title: "AI Settings",
  description: "AI settings for your organization.",
});

const AiSettings = async () => {
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    notFound();
  }

  const organization = await database
    .select({ productDescription: tables.organization.productDescription })
    .from(tables.organization)
    .where(eq(tables.organization.id, organizationId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!organization) {
    notFound();
  }

  return (
    <div className="px-6 py-16">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <div className="grid gap-2">
          <h1 className="m-0 font-semibold text-4xl tracking-tight">
            AI Settings
          </h1>
          <p className="mt-2 mb-0 text-muted-foreground">
            Manage your organization&apos;s AI settings.
          </p>
        </div>
        <Suspense fallback={null}>
          <AiIndexingChart />
        </Suspense>
      </div>
    </div>
  );
};

export default AiSettings;
