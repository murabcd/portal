import "server-only";

import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import { parseError } from "@repo/lib/parse-error";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

type ConnectToJiraProperties = {
  readonly featureId: (typeof tables.feature.$inferSelect)["id"];
  readonly externalId: string;
  readonly href: string;
};

export const connectToJira = async ({
  featureId,
  externalId,
  href,
}: ConnectToJiraProperties): Promise<{
  error?: string;
}> => {
  try {
    const atlassianInstallation = await database
      .select({
        id: tables.atlassianInstallation.id,
        organizationId: tables.atlassianInstallation.organizationId,
      })
      .from(tables.atlassianInstallation)
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!atlassianInstallation) {
      throw new Error("Jira installation not found");
    }

    await database.insert(tables.featureConnection).values([
      {
        id: createId(),
        featureId,
        externalId,
        href,
        organizationId: atlassianInstallation.organizationId,
        type: "JIRA",
        updatedAt: new Date().toISOString(),
      },
    ]);

    revalidatePath("/features", "page");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
