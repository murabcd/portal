"use server";

import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { Feature } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

type CreateFeatureProperties = {
  title: Feature["title"];
  assignee: Feature["ownerId"];
  productId: string | undefined;
  groupId: string | undefined;
};

export const createFeature = async ({
  title,
  assignee,
  productId,
  groupId,
}: CreateFeatureProperties): Promise<
  | {
      error: string;
    }
  | {
      id: Feature["id"];
    }
> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("You must be logged in to create a feature.");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You must be an editor to create a feature.");
    }

    const [defaultStatus, organization] = await Promise.all([
      database
        .select({ id: tables.featureStatus.id })
        .from(tables.featureStatus)
        .where(eq(tables.featureStatus.organizationId, organizationId))
        .orderBy(asc(tables.featureStatus.order))
        .limit(1)
        .then((rows) => rows[0] ?? null),
      database
        .select({ id: tables.organization.id })
        .from(tables.organization)
        .where(eq(tables.organization.id, organizationId))
        .limit(1)
        .then((rows) => rows[0] ?? null),
    ]);

    if (!organization) {
      throw new Error("Organization not found");
    }

    if (!defaultStatus) {
      throw new Error("You must have a feature status to create a feature.");
    }

    const id = createId();
    const now = new Date().toISOString();

    await database.insert(tables.feature).values([
      {
        id,
        title,
        organizationId,
        creatorId: user.id,
        ownerId: assignee,
        statusId: defaultStatus.id,
        productId,
        groupId,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    revalidatePath("/features");

    return { id };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
