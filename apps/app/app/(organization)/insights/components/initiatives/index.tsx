import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { eq, sql } from "drizzle-orm";
import { Suspense } from "react";
import { InitiativesEmptyState } from "@/app/(organization)/initiatives/components/initiatives-empty-state";
import { NewInitiativePages } from "./new-initiative-pages";
import { NewInitiatives } from "./new-initiatives";
import { InitiativesTrend } from "./trend";

export const InitiativesSection = async () => {
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return <div />;
  }

  const initiativeCount =
    (await database
      .select({ count: sql<number>`count(*)` })
      .from(tables.initiative)
      .where(eq(tables.initiative.organizationId, organizationId))
      .then((rows) => rows[0]?.count)) ?? 0;

  if (initiativeCount === 0) {
    return (
      <div className="p-16">
        <InitiativesEmptyState />
      </div>
    );
  }

  return (
    <section className="space-y-4 p-4 sm:p-8">
      <div>
        <p className="font-medium text-sm">Initiatives</p>
        <InitiativesTrend />
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        <Suspense fallback={null}>
          <NewInitiatives />
        </Suspense>
        <Suspense fallback={null}>
          <NewInitiativePages />
        </Suspense>
      </div>
    </section>
  );
};
