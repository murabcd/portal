"use server";

import { PortalRole } from "@repo/backend/auth";
import { currentMembers, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const updateUserRole = async (
  userId: string,
  role: PortalRole
): Promise<{ error?: string }> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.organizationRole !== PortalRole.Admin) {
      throw new Error("You are not authorized to update user roles");
    }

    const members = await currentMembers();
    const admins = members.filter(
      (member) => member.organizationRole === PortalRole.Admin
    );

    if (admins.length === 1) {
      const [admin] = admins;

      if (admin.id === userId && role !== PortalRole.Admin) {
        throw new Error("There must be at least one admin.");
      }
    }

    await database
      .update(tables.user)
      .set({ organizationRole: role, updatedAt: new Date() })
      .where(eq(tables.user.id, userId));

    revalidatePath("/settings/members");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
