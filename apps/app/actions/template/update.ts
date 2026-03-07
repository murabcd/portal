"use server";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import type { Feature, Template } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const updateTemplate = async (
  id: Template["id"],
  data: Omit<Partial<Template>, "content"> & {
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
      throw new Error("You don't have permission to update templates");
    }

    const { id: _ignored, ...updates } = data;

    await database
      .update(tables.template)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(tables.template.id, id));

    revalidatePath("/settings/templates");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};

export const updateTemplateFromFeature = async (
  templateId: Template["id"],
  featureId: Feature["id"]
): Promise<
  | object
  | {
      error: string;
    }
> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to update templates");
    }

    const feature = await database
      .select({ id: tables.feature.id })
      .from(tables.feature)
      .where(eq(tables.feature.id, featureId))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!feature) {
      throw new Error("Feature not found");
    }

    const content = await getJsonColumnFromTable(
      "feature",
      "content",
      feature.id
    );

    if (!content) {
      throw new Error("Content not found");
    }

    await updateTemplate(templateId, { content });

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
