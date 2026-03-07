import "server-only";

import { createClient } from "@repo/atlassian";
import { getJsonColumnFromTable, tables } from "@repo/backend/database";
import type { JSONContent } from "@repo/editor";
import { convertToAdf } from "@repo/editor/lib/jira";
import { textToContent } from "@repo/editor/lib/tiptap";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { database } from "@/lib/database";

type CreateJiraIssueProperties = {
  readonly projectId: string;
  readonly typeId: string;
  readonly featureId: (typeof tables.feature.$inferSelect)["id"];
};

export const createJiraIssue = async ({
  projectId,
  typeId,
  featureId,
}: CreateJiraIssueProperties): Promise<{
  id?: string;
  href?: string;
  error?: string;
}> => {
  try {
    const [installation, feature] = await Promise.all([
      database
        .select({
          accessToken: tables.atlassianInstallation.accessToken,
          siteUrl: tables.atlassianInstallation.siteUrl,
          email: tables.atlassianInstallation.email,
        })
        .from(tables.atlassianInstallation)
        .limit(1)
        .then((rows) => rows[0] ?? null),
      database
        .select({
          id: tables.feature.id,
          title: tables.feature.title,
          endAt: tables.feature.endAt,
        })
        .from(tables.feature)
        .where(eq(tables.feature.id, featureId))
        .limit(1)
        .then((rows) => rows[0] ?? null),
    ]);

    if (!installation) {
      throw new Error("Installation not found");
    }

    if (!feature) {
      throw new Error("Feature not found");
    }

    const content = await getJsonColumnFromTable(
      "feature",
      "content",
      feature.id
    );

    const body = (content ?? textToContent("")) as JSONContent;
    const atlassian = createClient(installation);
    const response = await atlassian.POST("/rest/api/2/issue", {
      body: {
        fields: {
          description: {
            ...convertToAdf(body),
            version: 1,
          },
          duedate: feature.endAt
            ? new Date(feature.endAt).toISOString().split("T")[0]
            : undefined,
          issuetype: {
            id: typeId,
          },
          labels: ["portal"],
          project: {
            id: projectId,
          },
          /*
           * reporter: {
           *   id: '5b10a2844c20165700ede21g',
           * },
           */
          summary: feature.title,
        },
      },
    });

    if (response.error) {
      throw new Error(
        `Error creating Jira issue: ${response.error.errorMessages?.join(", ")}`
      );
    }

    if (!(response.data.id && response.data.key)) {
      throw new Error("No issue ID or key returned from Jira");
    }

    return {
      id: response.data.id,
      href: new URL(
        `/browse/${response.data.key}`,
        installation.siteUrl
      ).toString(),
    };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
