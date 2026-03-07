import "server-only";

import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import { createId } from "@repo/backend/id";
import { markdownToContent } from "@repo/editor/lib/tiptap";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { friendlyWords } from "friendlier-words";
import { database } from "@/lib/database";

type MarkdownChangelog = {
  title: string | string[] | undefined;
  content: string | undefined;
  createdAt: string | string[] | undefined;
  slug: string | string[] | undefined;
  tags: string | string[] | undefined;
};

export const importMarkdown = async (
  changelogs: MarkdownChangelog[]
): Promise<{
  error?: string;
}> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("Not authorized");
    }

    // Ensure all the tags are created first so we can link them
    const existingTags = await database
      .select()
      .from(tables.changelogTag)
      .where(eq(tables.changelogTag.organizationId, organizationId));
    const allTags = new Set<string>();

    for (const changelog of changelogs) {
      if (Array.isArray(changelog.tags)) {
        for (const tag of changelog.tags) {
          allTags.add(tag);
        }
      }
    }

    const tagsToCreate = Array.from(allTags).filter(
      (tag) => !existingTags.some(({ name }) => name === tag)
    );

    if (tagsToCreate.length > 0) {
      await database
        .insert(tables.changelogTag)
        .values(
          tagsToCreate.map((tag) => ({
            id: createId(),
            name: tag,
            organizationId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            fromMarkdown: true,
          }))
        )
        .onConflictDoNothing();
    }

    const newTags = await database
      .select()
      .from(tables.changelogTag)
      .where(eq(tables.changelogTag.organizationId, organizationId));

    for (const changelog of changelogs) {
      const { tags } = changelog;
      const content = changelog.content
        ? ((await markdownToContent(changelog.content)) as JsonValue)
        : undefined;

      const createdAt =
        typeof changelog.createdAt === "string"
          ? new Date(changelog.createdAt).toISOString()
          : new Date().toISOString();

      const changelogId = createId();

      await database.transaction(async (tx) => {
        await tx.insert(tables.changelog).values([
          {
            id: changelogId,
            organizationId,
            creatorId: user.id,
            fromMarkdown: true,
            status: "PUBLISHED",
            title:
              typeof changelog.title === "string"
                ? changelog.title
                : friendlyWords(),
            createdAt,
            updatedAt: createdAt,
            publishAt: createdAt,
            slug:
              typeof changelog.slug === "string" ? changelog.slug : undefined,
            content,
          },
        ]);

        const tagIds = Array.isArray(tags)
          ? newTags
              .filter((tag) => tags.includes(tag.name))
              .map((tag) => tag.id)
          : [];

        if (tagIds.length > 0) {
          await tx.insert(tables.changelogToChangelogTag).values(
            tagIds.map((tagId) => ({
              a: changelogId,
              b: tagId,
            }))
          );
        }
      });
    }

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
