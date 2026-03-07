import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { getUserName } from "@repo/backend/auth/format";
import {
  currentMembers,
  currentOrganizationId,
  currentUser,
} from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import type { Initiative, InitiativeUpdate } from "@repo/backend/types";
import { markdownToContent, textToContent } from "@repo/editor/lib/tiptap";
import { parseError } from "@repo/lib/parse-error";
import { generateText } from "ai";
import { and, desc, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const generateInitiativeUpdateContent = async (
  initiativeId: Initiative["id"],
  initiativeUpdateId: InitiativeUpdate["id"]
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

    if (user.organizationRole === PortalRole.Member) {
      throw new Error(
        "You do not have permission to generate initiative updates"
      );
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

    const lastUpdate = await database
      .select()
      .from(tables.initiativeUpdate)
      .where(eq(tables.initiativeUpdate.initiativeId, initiativeId))
      .orderBy(desc(tables.initiativeUpdate.createdAt))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    let content: JsonValue = textToContent("") as JsonValue;

    if (lastUpdate) {
      const [initiative, members] = await Promise.all([
        database
          .select({ title: tables.initiative.title })
          .from(tables.initiative)
          .where(eq(tables.initiative.id, initiativeId))
          .limit(1)
          .then((rows) => rows[0] ?? null),
        currentMembers(),
      ]);

      if (initiative) {
        const [features, pages, canvases, externalLinks, team] =
          await Promise.all([
            database
              .select({
                title: tables.feature.title,
                content: tables.feature.content,
              })
              .from(tables.feature)
              .innerJoin(
                tables.featureToInitiative,
                eq(tables.featureToInitiative.a, tables.feature.id)
              )
              .innerJoin(
                tables.featureStatus,
                eq(tables.featureStatus.id, tables.feature.statusId)
              )
              .where(
                and(
                  eq(tables.featureToInitiative.b, initiativeId),
                  eq(tables.featureStatus.complete, true),
                  gte(tables.feature.endAt, lastUpdate.createdAt)
                )
              ),
            database
              .select({
                title: tables.initiativePage.title,
                content: tables.initiativePage.content,
              })
              .from(tables.initiativePage)
              .where(
                and(
                  eq(tables.initiativePage.initiativeId, initiativeId),
                  gte(tables.initiativePage.createdAt, lastUpdate.createdAt)
                )
              ),
            database
              .select({
                title: tables.initiativeCanvas.title,
              })
              .from(tables.initiativeCanvas)
              .where(
                and(
                  eq(tables.initiativeCanvas.initiativeId, initiativeId),
                  gte(tables.initiativeCanvas.createdAt, lastUpdate.createdAt)
                )
              ),
            database
              .select({
                title: tables.initiativeExternalLink.title,
                href: tables.initiativeExternalLink.href,
              })
              .from(tables.initiativeExternalLink)
              .where(
                and(
                  eq(tables.initiativeExternalLink.initiativeId, initiativeId),
                  gte(
                    tables.initiativeExternalLink.createdAt,
                    lastUpdate.createdAt
                  )
                )
              ),
            database
              .select({
                userId: tables.initiativeMember.userId,
              })
              .from(tables.initiativeMember)
              .where(
                and(
                  eq(tables.initiativeMember.initiativeId, initiativeId),
                  gte(tables.initiativeMember.createdAt, lastUpdate.createdAt)
                )
              ),
          ]);

        const markdown = await generateText({
          model: "openai/gpt-5-nano",
          system: [
            "You are an AI that generates a update for an initiative that will be shared with the initiative stakeholders.",
            "You will be given a list of content that has been created for that have been completed since the last update",
            "Do not give the update a title, as it will be generated by the user.",
            "Be as specific as possible.",
            "Format your response in Markdown.",
          ].join("\n"),
          prompt: [
            `Initiative name: ${initiative.title}`,
            "Features that have been completed since the last update:",
            ...features.map(
              (feature) =>
                `- ${feature.title}: ${feature.content ?? "No description provided."}`
            ),
            "------",
            "Initiative pages that have been created since the last update:",
            ...pages.map(
              (page) =>
                `- ${page.title}: ${page.content ?? "No description provided."}`
            ),
            "------",
            "Initiative canvases that have been created since the last update:",
            ...canvases.map((canvas) => `- ${canvas.title}`),
            "------",
            "External links that have been added to the initiative since the last update:",
            ...externalLinks.map((link) => `- ${link.title}: ${link.href}`),
            "------",
            "Members that have been added to the initiative since the last update:",
            ...team
              .map((teamMember) => {
                const memberUser = members.find(
                  (member) => member.id === teamMember.userId
                );

                if (!memberUser) {
                  return null;
                }

                return `- ${getUserName(memberUser)}`;
              })
              .filter(Boolean),
          ].join("\n"),
        });

        content = (await markdownToContent(markdown.text)) as JsonValue;
      }
    }

    const update = await database
      .update(tables.initiativeUpdate)
      .set({ content, updatedAt: new Date().toISOString() })
      .where(eq(tables.initiativeUpdate.id, initiativeUpdateId))
      .returning({
        id: tables.initiativeUpdate.id,
        initiativeId: tables.initiativeUpdate.initiativeId,
      })
      .then((rows) => rows[0]);

    revalidatePath(`/initiative/${update.initiativeId}/updates/${update.id}`);

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
