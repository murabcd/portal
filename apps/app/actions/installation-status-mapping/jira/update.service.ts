import "server-only";

import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import { logger } from "@repo/lib/logger";
import { parseError } from "@repo/lib/parse-error";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const updateJiraStatusMappings = async (
  installationId: (typeof tables.atlassianInstallation.$inferSelect)["id"],
  featureStatusId: (typeof tables.featureStatus.$inferSelect)["id"],
  jiraStatuses: {
    value: string;
    label: string;
  }[]
): Promise<{
  error?: string;
}> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("Not logged in");
    }

    logger.info({
      event: "jira_status_mapping_delete_start",
      installation_id: installationId,
      feature_status_id: featureStatusId,
      organization_id: organizationId,
    });

    // 1. Delete existing mappings for the feature status
    await database
      .delete(tables.installationStatusMapping)
      .where(
        and(
          eq(tables.installationStatusMapping.type, "JIRA"),
          eq(tables.installationStatusMapping.organizationId, organizationId),
          eq(tables.installationStatusMapping.featureStatusId, featureStatusId)
        )
      );

    logger.info({
      event: "jira_status_mapping_create_start",
      installation_id: installationId,
      feature_status_id: featureStatusId,
      organization_id: organizationId,
      jira_status_count: jiraStatuses.length,
    });

    const data = jiraStatuses.map((jiraStatus) => ({
      id: createId(),
      organizationId,
      type: "JIRA" as const,
      featureStatusId,
      eventId: jiraStatus.value,
      eventType: jiraStatus.label,
      creatorId: user.id,
      updatedAt: new Date().toISOString(),
    }));

    // 2. Create new mappings for the feature status
    if (data.length) {
      await database.insert(tables.installationStatusMapping).values(data);
    }

    revalidatePath("/settings/integrations/jira");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
