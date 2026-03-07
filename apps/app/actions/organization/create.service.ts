import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import { colors } from "@repo/design-system/lib/colors";
import { parseError } from "@repo/lib/parse-error";
import { slugify } from "@repo/lib/slugify";
import { eq } from "drizzle-orm";

type CreateOrganizationProps = {
  name: string;
  productDescription: string;
};

export const createOrganization = async ({
  name,
  productDescription,
}: CreateOrganizationProps): Promise<
  | { id: string }
  | {
      error: string;
    }
> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("User not found");
    }

    let slug = slugify(name);

    const existingOrganization = await database
      .select({ id: tables.organization.id })
      .from(tables.organization)
      .where(eq(tables.organization.slug, slug))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (existingOrganization) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const organizationId = createId();
    const now = new Date();
    const nowIso = now.toISOString();

    await database.transaction(async (tx) => {
      await tx.insert(tables.organization).values([
        {
          id: organizationId,
          name,
          slug,
          productDescription,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ]);

      await tx.insert(tables.featureStatus).values([
        {
          id: createId(),
          organizationId,
          name: "Backlog",
          color: colors.rose,
          order: 0,
          complete: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        {
          id: createId(),
          organizationId,
          name: "In Progress",
          color: colors.yellow,
          order: 1,
          complete: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        {
          id: createId(),
          organizationId,
          name: "Completed",
          color: colors.emerald,
          order: 2,
          complete: true,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ]);
    });

    await database
      .update(tables.user)
      .set({
        organizationId,
        organizationRole: PortalRole.Admin,
        updatedAt: now,
      })
      .where(eq(tables.user.id, user.id));

    return { id: organizationId };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
