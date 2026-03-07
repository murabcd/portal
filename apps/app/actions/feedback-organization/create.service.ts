import "server-only";

import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { FeedbackOrganization, FeedbackUser } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

type CreateFeedbackOrganizationProperties = {
  name: FeedbackOrganization["name"];
  domain: FeedbackOrganization["domain"];
  feedbackUser: FeedbackUser["id"];
};

export const createFeedbackOrganization = async ({
  name,
  domain,
  feedbackUser,
}: CreateFeedbackOrganizationProperties): Promise<{
  id?: FeedbackOrganization["id"];
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

    const existingOrganization = await database
      .select({ id: tables.feedbackOrganization.id })
      .from(tables.feedbackOrganization)
      .where(
        and(
          domain
            ? eq(tables.feedbackOrganization.domain, domain)
            : isNull(tables.feedbackOrganization.domain),
          eq(tables.feedbackOrganization.organizationId, organizationId)
        )
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (existingOrganization) {
      return { id: existingOrganization.id };
    }

    const id = createId();
    const now = new Date().toISOString();
    await database.transaction(async (tx) => {
      await tx.insert(tables.feedbackOrganization).values([
        {
          id,
          name,
          domain,
          organizationId,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await tx
        .update(tables.feedbackUser)
        .set({ feedbackOrganizationId: id, updatedAt: now })
        .where(eq(tables.feedbackUser.id, feedbackUser));
    });

    revalidatePath("/", "layout");

    return { id };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
