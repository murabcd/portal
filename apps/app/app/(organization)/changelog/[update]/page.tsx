import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import type { JSONContent } from "@repo/editor";
import { contentToText } from "@repo/editor/lib/tiptap";
import { createMetadata } from "@repo/lib/metadata";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChangelogEditor } from "./components/changelog-editor";
import { ChangelogSidebar } from "./components/changelog-sidebar";
import { ChangelogTitle } from "./components/changelog-title";
import { UpdateEmptyState } from "./components/update-empty-state";

type ChangelogPageProperties = {
  readonly params: Promise<{
    readonly update: string;
  }>;
};

export const generateMetadata = async (
  props: ChangelogPageProperties
): Promise<Metadata> => {
  const params = await props.params;
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return {};
  }

  const [changelog] = await database
    .select({
      id: tables.changelog.id,
      title: tables.changelog.title,
    })
    .from(tables.changelog)
    .where(
      and(
        eq(tables.changelog.id, params.update),
        eq(tables.changelog.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!changelog) {
    return {};
  }

  const content = await getJsonColumnFromTable(
    "changelog",
    "content",
    changelog.id
  );
  const text = content ? contentToText(content) : "No content yet.";

  return createMetadata({
    title: changelog.title,
    description: text.slice(0, 150),
  });
};

const ChangelogPageContent = async (props: ChangelogPageProperties) => {
  const params = await props.params;
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    notFound();
  }

  const [changelogRows, organizationRows] = await Promise.all([
    database
      .select({
        id: tables.changelog.id,
        title: tables.changelog.title,
      })
      .from(tables.changelog)
      .where(
        and(
          eq(tables.changelog.id, params.update),
          eq(tables.changelog.organizationId, organizationId)
        )
      )
      .limit(1),
    database
      .select({ id: tables.organization.id })
      .from(tables.organization)
      .where(eq(tables.organization.id, organizationId))
      .limit(1),
  ]);

  const changelog = changelogRows[0];
  const organization = organizationRows[0];

  if (!(changelog && organization)) {
    notFound();
  }

  const content = await getJsonColumnFromTable(
    "changelog",
    "content",
    changelog.id
  );

  return (
    <div className="flex h-full divide-x">
      <div className="w-full px-6 py-16">
        <div className="mx-auto grid w-full max-w-prose gap-6">
          <ChangelogTitle
            changelogId={changelog.id}
            defaultTitle={changelog.title}
            editable={user.organizationRole !== PortalRole.Member}
          />
          {content ? (
            <ChangelogEditor
              changelogId={changelog.id}
              defaultValue={content as JSONContent}
              editable={user.organizationRole !== PortalRole.Member}
            />
          ) : (
            <UpdateEmptyState changelogId={changelog.id} />
          )}
        </div>
      </div>
      <ChangelogSidebar changelogId={params.update} />
    </div>
  );
};

const ChangelogPage = (props: ChangelogPageProperties) => (
  <Suspense fallback={null}>
    <ChangelogPageContent {...props} />
  </Suspense>
);

export default ChangelogPage;
