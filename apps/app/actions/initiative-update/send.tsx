"use server";

import { PortalRole } from "@repo/backend/auth";
import {
  currentMembers,
  currentOrganizationId,
  currentUser,
} from "@repo/backend/auth/utils";
import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import type { InitiativeUpdate } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";

export const sendInitiativeUpdate = async (
  initiativeUpdateId: InitiativeUpdate["id"]
): Promise<{
  error?: string;
}> => {
  try {
    const [user, organizationId, members] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
      currentMembers(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You do not have permission to send initiative updates");
    }

    const [updateRows, content] = await Promise.all([
      database
        .select({
          title: tables.initiativeUpdate.title,
          creatorId: tables.initiativeUpdate.creatorId,
          initiativeId: tables.initiativeUpdate.initiativeId,
        })
        .from(tables.initiativeUpdate)
        .where(eq(tables.initiativeUpdate.id, initiativeUpdateId))
        .limit(1),
      getJsonColumnFromTable(
        "initiative_update",
        "content",
        initiativeUpdateId
      ),
    ]);

    const update = updateRows[0];

    if (!update) {
      throw new Error("Initiative update not found");
    }

    const team = await database
      .select({ userId: tables.initiativeMember.userId })
      .from(tables.initiativeMember)
      .where(eq(tables.initiativeMember.initiativeId, update.initiativeId));

    if (!team.length) {
      throw new Error("No team members found.");
    }

    if (!(content && Object.keys(content).length)) {
      throw new Error("Initiative update content not found");
    }

    const [users, owner] = await Promise.all([
      members.filter((member) =>
        team.some(({ userId }) => userId === member.id)
      ),
      members.find((member) => member.id === update.creatorId),
    ]);

    if (!owner) {
      throw new Error("Owner not found.");
    }

    if (!users.length) {
      throw new Error("No users found.");
    }

    const emails = users
      .map((member) => member.email)
      .filter(Boolean) as string[];

    if (!emails.length) {
      throw new Error("No emails found.");
    }

    throw new Error("Email sending is disabled. GitHub-only auth is enabled.");
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
