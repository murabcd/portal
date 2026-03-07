import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const removeUser = async (
  userId: string
): Promise<{ error: string } | { message: string }> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.organizationRole !== PortalRole.Admin) {
      throw new Error("You are not authorized to delete users");
    }

    if (!organizationId) {
      throw new Error("Not logged in");
    }

    const organization = await database
      .select({ id: tables.organization.id })
      .from(tables.organization)
      .where(eq(tables.organization.id, organizationId))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!organization) {
      throw new Error("Organization not found");
    }

    await database
      .update(tables.user)
      .set({
        organizationId: null,
        organizationRole: null,
        updatedAt: new Date(),
      })
      .where(eq(tables.user.id, userId));

    revalidatePath("/settings/members");

    return { message: "Member removed successfully" };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
