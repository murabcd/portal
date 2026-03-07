import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { createMetadata } from "@repo/lib/metadata";
import { eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstallJira } from "./components/install";
import { ManageJira } from "./components/manage";

export const metadata: Metadata = createMetadata({
  title: "Jira Integration",
  description: "Configure your Jira integration settings.",
});

const JiraIntegrationSettings = async () => {
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    notFound();
  }

  const count =
    (await database
      .select({ count: sql<number>`count(*)` })
      .from(tables.atlassianInstallation)
      .where(eq(tables.atlassianInstallation.organizationId, organizationId))
      .then((rows) => rows[0]?.count)) ?? 0;
  const installCount = Number(count) || 0;

  if (installCount === 0) {
    return <InstallJira />;
  }

  return <ManageJira />;
};

export default JiraIntegrationSettings;
