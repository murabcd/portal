import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { StackCard } from "@repo/design-system/components/stack-card";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JiraFieldMappings } from "./jira-field-mappings";
import { JiraStatusMappings } from "./jira-status-mappings";
import { RemoveJiraButton } from "./remove-jira-button";

export const ManageJira = async () => {
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return notFound();
  }

  const atlassianInstallation = await database
    .select({ id: tables.atlassianInstallation.id })
    .from(tables.atlassianInstallation)
    .where(eq(tables.atlassianInstallation.organizationId, organizationId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!atlassianInstallation) {
    return notFound();
  }

  return (
    <>
      <div className="grid gap-2">
        <h1 className="m-0 font-semibold text-4xl tracking-tight">Jira</h1>
        <p className="mb-0 text-muted-foreground">
          Manage your Jira integration.
        </p>
      </div>

      <Suspense fallback={null}>
        <JiraStatusMappings />
      </Suspense>

      <Suspense fallback={null}>
        <JiraFieldMappings />
      </Suspense>

      <StackCard className="flex items-center gap-4" title="Danger Zone">
        <RemoveJiraButton />
      </StackCard>
    </>
  );
};
