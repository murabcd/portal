"use server";

import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import { createId } from "@repo/backend/id";
import type { Feature, Template } from "@repo/backend/types";
import { textToContent } from "@repo/editor/lib/tiptap";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";

export const createTemplate = async (
  title: Template["title"],
  description: Template["description"],
  content?: JsonValue
): Promise<
  | {
      id: Template["id"];
    }
  | {
      error: string;
    }
> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error(
        "You don't have permission to create templates for this organization"
      );
    }

    const id = createId();
    const now = new Date().toISOString();

    await database.insert(tables.template).values([
      {
        id,
        createdAt: now,
        updatedAt: now,
        title,
        description,
        organizationId,
        creatorId: user.id,
        content: content ?? (textToContent("") as JsonValue),
      },
    ]);

    return { id };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};

export const createTemplateFromFeature = async (
  featureId: Feature["id"],
  title: Template["title"],
  description: Template["description"]
): Promise<
  | object
  | {
      error: string;
    }
> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error(
        "You don't have permission to create templates for this organization"
      );
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

    await database.insert(tables.template).values([
      {
        id: createId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title,
        description,
        organizationId,
        creatorId: user.id,
        content: content ?? (textToContent("") as JsonValue),
      },
    ]);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
