import "server-only";
import { logger, serializeError } from "@repo/lib/logger";
import { desc, eq } from "drizzle-orm";
import { database, getJsonColumnFromTable, tables } from "./database";
import type { JsonValue } from "./drizzle/schema";

type LatestPublishedChangelogTitle = {
  title: string;
};

type LatestPublishedChangelogEntry = {
  id: string;
  title: string;
  publishAt: string;
  contributors: Array<{ userId: string }>;
  tags: Array<{ id: string; name: string }>;
  content: JsonValue | null;
};

const isDatabaseUnavailableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    if (error.message.includes("ECONNREFUSED")) {
      return true;
    }

    if ("cause" in error) {
      return isDatabaseUnavailableError(error.cause);
    }
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "ECONNREFUSED"
  ) {
    return true;
  }

  return false;
};

const logPublicChangelogError = (target: string, error: unknown) => {
  if (
    process.env.NODE_ENV === "development" &&
    isDatabaseUnavailableError(error)
  ) {
    return;
  }

  logger.error({
    event: "public_changelog_query_failed",
    scope: "public_changelog",
    target,
    error: serializeError(error),
  });
};

export const getLatestPublishedChangelogTitle =
  async (): Promise<LatestPublishedChangelogTitle | null> => {
    try {
      return await database
        .select({ title: tables.changelog.title })
        .from(tables.changelog)
        .where(eq(tables.changelog.status, "PUBLISHED"))
        .orderBy(desc(tables.changelog.publishAt))
        .limit(1)
        .then((rows) => rows[0] ?? null);
    } catch (error) {
      logPublicChangelogError("title", error);
      return null;
    }
  };

export const getLatestPublishedChangelogEntry =
  async (): Promise<LatestPublishedChangelogEntry | null> => {
    try {
      const latestUpdate = await database
        .select({
          id: tables.changelog.id,
          title: tables.changelog.title,
          publishAt: tables.changelog.publishAt,
        })
        .from(tables.changelog)
        .where(eq(tables.changelog.status, "PUBLISHED"))
        .orderBy(desc(tables.changelog.publishAt))
        .limit(1)
        .then((rows) => rows[0] ?? null);

      if (!latestUpdate) {
        return null;
      }

      const [contributors, tags, content] = await Promise.all([
        database
          .select({ userId: tables.changelogContributor.userId })
          .from(tables.changelogContributor)
          .where(eq(tables.changelogContributor.changelogId, latestUpdate.id)),
        database
          .select({
            id: tables.changelogTag.id,
            name: tables.changelogTag.name,
          })
          .from(tables.changelogToChangelogTag)
          .innerJoin(
            tables.changelogTag,
            eq(tables.changelogTag.id, tables.changelogToChangelogTag.b)
          )
          .where(eq(tables.changelogToChangelogTag.a, latestUpdate.id)),
        getJsonColumnFromTable("changelog", "content", latestUpdate.id),
      ]);

      return {
        ...latestUpdate,
        contributors,
        tags,
        content,
      };
    } catch (error) {
      logPublicChangelogError("entry", error);
      return null;
    }
  };
