import "server-only";

import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import { logger } from "@repo/lib/logger";
import { parseError } from "@repo/lib/parse-error";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const updateJiraFieldMappings = async (
  installationId: (typeof tables.atlassianInstallation.$inferSelect)["id"],
  internal: {
    id: (typeof tables.installationFieldMapping.$inferSelect)["internalId"];
    type: (typeof tables.installationFieldMapping.$inferSelect)["internalType"];
  },
  externals: {
    id: (typeof tables.installationFieldMapping.$inferSelect)["externalId"];
    type: (typeof tables.installationFieldMapping.$inferSelect)["externalType"];
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
      event: "jira_field_mapping_delete_start",
      installation_id: installationId,
      internal_id: internal.id,
      organization_id: organizationId,
    });

    // 1. Delete existing mappings for the feature status
    await database
      .delete(tables.installationFieldMapping)
      .where(
        and(
          eq(tables.installationFieldMapping.organizationId, organizationId),
          eq(tables.installationFieldMapping.type, "JIRA"),
          eq(tables.installationFieldMapping.internalId, internal.id)
        )
      );

    logger.info({
      event: "jira_field_mapping_create_start",
      installation_id: installationId,
      internal_id: internal.id,
      organization_id: organizationId,
      external_count: externals.length,
    });

    const data = externals.map((external) => ({
      id: createId(),
      organizationId,
      type: "JIRA" as const,
      internalId: internal.id,
      internalType: internal.type,
      externalId: external.id,
      externalType: external.type,
      creatorId: user.id,
      updatedAt: new Date().toISOString(),
    }));

    // 2. Create new mappings for the feature status
    if (data.length) {
      await database.insert(tables.installationFieldMapping).values(data);
    }

    revalidatePath("/settings/integrations/jira");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
