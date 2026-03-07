import "server-only";

import { createClient } from "@repo/atlassian";
import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { getJsonColumnFromTable, tables } from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import { textToContent } from "@repo/editor/lib/tiptap";
import atlassianTemplate from "@repo/editor/templates/atlassian.json";
import loomTemplate from "@repo/editor/templates/loom.json";
import notionTemplate from "@repo/editor/templates/notion.json";
import { parseError } from "@repo/lib/parse-error";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

const updateJira = async (
  connection: typeof tables.featureConnection.$inferSelect,
  data: Partial<typeof tables.feature.$inferSelect>
) => {
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    throw new Error("Organization not found");
  }

  const [installation, fieldMappings] = await Promise.all([
    database
      .select()
      .from(tables.atlassianInstallation)
      .where(eq(tables.atlassianInstallation.organizationId, organizationId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    database
      .select()
      .from(tables.installationFieldMapping)
      .where(
        and(
          eq(tables.installationFieldMapping.organizationId, organizationId),
          eq(tables.installationFieldMapping.type, "JIRA")
        )
      ),
  ]);

  if (!installation) {
    throw new Error("Atlassian installation not found");
  }

  const fields: Record<string, unknown> = {};

  if (data.title) {
    fields.summary = data.title;
  }

  const startAtMapping = fieldMappings.find(
    (mapping) => mapping.internalId === "STARTAT"
  );
  const endAtMapping = fieldMappings.find(
    (mapping) => mapping.internalId === "ENDAT"
  );

  const startAtValue = typeof data.startAt === "string" ? data.startAt : null;
  const endAtValue = typeof data.endAt === "string" ? data.endAt : null;

  if (startAtValue && startAtMapping) {
    fields[startAtMapping.externalId] = startAtValue.split("T")[0];
  }

  if (endAtValue && endAtMapping) {
    fields[endAtMapping.externalId] = endAtValue.split("T")[0];
  }

  if (!Object.keys(fields).length) {
    return;
  }

  const atlassian = createClient(installation);
  const response = await atlassian.PUT("/rest/api/2/issue/{issueIdOrKey}", {
    params: {
      path: {
        issueIdOrKey: connection.externalId,
      },
    },
    body: {
      fields,
    },
  });

  if (response.error) {
    throw new Error("Failed to update Jira ticket.");
  }
};

export const updateFeature = async (
  featureId: (typeof tables.feature.$inferSelect)["id"],
  data: Omit<
    Partial<typeof tables.feature.$inferSelect>,
    "content" | "canvas"
  > & {
    canvas?: JsonValue;
    content?: JsonValue;
  }
): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to update features");
    }

    if (data.groupId && !data.productId) {
      const group = await database
        .select({ productId: tables.group.productId })
        .from(tables.group)
        .where(eq(tables.group.id, data.groupId))
        .limit(1)
        .then((rows) => rows[0] ?? null);

      if (!group) {
        throw new Error("Group not found");
      }

      data.productId = group.productId;
    }

    const updateData: Partial<typeof tables.feature.$inferInsert> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if ("startAt" in data) {
      updateData.startAt =
        typeof data.startAt === "string" ? data.startAt : null;
    }

    if ("endAt" in data) {
      updateData.endAt = typeof data.endAt === "string" ? data.endAt : null;
    }

    if (data.canvas) {
      updateData.canvas = data.canvas;
    }

    if (data.content) {
      updateData.content = data.content;
    }

    await database
      .update(tables.feature)
      .set(updateData)
      .where(eq(tables.feature.id, featureId));

    const featureConnection = await database
      .select()
      .from(tables.featureConnection)
      .where(eq(tables.featureConnection.featureId, featureId))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (featureConnection?.type === "JIRA") {
      await updateJira(featureConnection, data);
    }

    revalidatePath("/features");
    revalidatePath("/roadmap");
    revalidatePath(`/features/${featureId}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};

export const updateFeatureFromTemplate = async (
  featureId: (typeof tables.feature.$inferSelect)["id"],
  templateId: (typeof tables.template.$inferSelect)["id"] | null
): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to update features");
    }

    let content = textToContent("") as JsonValue;

    switch (templateId) {
      case "atlassian": {
        content = atlassianTemplate as unknown as JsonValue;

        break;
      }
      case "notion": {
        content = notionTemplate as unknown as JsonValue;

        break;
      }
      case "loom": {
        content = loomTemplate as unknown as JsonValue;

        break;
      }
      default: {
        if (templateId) {
          const template = await database
            .select({ id: tables.template.id })
            .from(tables.template)
            .where(eq(tables.template.id, templateId))
            .limit(1)
            .then((rows) => rows[0] ?? null);

          if (!template) {
            throw new Error("Template not found.");
          }

          const templateContent = await getJsonColumnFromTable(
            "template",
            "content",
            template.id
          );

          if (templateContent) {
            content = templateContent as JsonValue;
          }
        }
      }
    }

    await updateFeature(featureId, { content });

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
