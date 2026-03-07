"use server";

import { getUserName } from "@repo/backend/auth/format";
import { currentMembers } from "@repo/backend/auth/utils";
import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import type { Feature } from "@repo/backend/types";
import { contentToText } from "@repo/editor/lib/tiptap";
import { and, desc, eq, lt, or } from "drizzle-orm";

export type GetFeatureResponse = Pick<
  Feature,
  "endAt" | "id" | "ownerId" | "startAt" | "title"
> & {
  readonly text: string;
  readonly owner: {
    readonly name: string | undefined;
    readonly email: string | undefined;
    readonly imageUrl: string | undefined;
  } | null;
};

type FeatureCursor = {
  readonly createdAt: string;
  readonly id: string;
};

export const getFeature = async (
  cursor?: FeatureCursor | null
): Promise<
  | {
      data: GetFeatureResponse;
    }
  | {
      error: unknown;
    }
> => {
  try {
    const cursorCondition = cursor
      ? or(
          lt(tables.feature.createdAt, cursor.createdAt),
          and(
            eq(tables.feature.createdAt, cursor.createdAt),
            lt(tables.feature.id, cursor.id)
          )
        )
      : undefined;

    const baseQuery = database
      .select({
        id: tables.feature.id,
        title: tables.feature.title,
        startAt: tables.feature.startAt,
        endAt: tables.feature.endAt,
        ownerId: tables.feature.ownerId,
      })
      .from(tables.feature)
      .orderBy(desc(tables.feature.createdAt), desc(tables.feature.id))
      .limit(1);

    const feature = await (cursorCondition
      ? baseQuery.where(cursorCondition)
      : baseQuery
    ).then((rows) => rows[0] ?? null);

    const members = await currentMembers();

    if (!feature) {
      throw new Error("Feature not found");
    }

    const owner = feature.ownerId
      ? members.find(({ id }) => id === feature.ownerId)
      : null;

    const content = await getJsonColumnFromTable(
      "feature",
      "content",
      feature.id
    );

    return {
      data: {
        ...feature,
        text: content ? contentToText(content) : "",
        owner: owner
          ? {
              name: getUserName(owner),
              email: owner.email ?? undefined,
              imageUrl: owner.image ?? undefined,
            }
          : null,
      },
    };
  } catch (error) {
    return { error };
  }
};
