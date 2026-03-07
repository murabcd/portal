import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { Tooltip } from "@repo/design-system/components/precomposed/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@repo/design-system/components/ui/resizable";
import { createMetadata } from "@repo/lib/metadata";
import { eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { ChangelogEmptyState } from "./components/changelog-empty-state";
import { ChangelogList } from "./components/changelog-list";
import { CreateChangelogButton } from "./components/create-changelog-button";

type ChangelogLayoutProperties = {
  readonly children: ReactNode;
};

const title = "Changelog";
const description = "View the changelog for the organization.";

export const metadata: Metadata = createMetadata({
  title,
  description,
});

const ChangelogLayout = async ({ children }: ChangelogLayoutProperties) => {
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    notFound();
  }

  const [countResult] = await Promise.all([
    database
      .select({ count: sql<number>`count(*)` })
      .from(tables.changelog)
      .where(eq(tables.changelog.organizationId, organizationId)),
  ]);

  const count = countResult?.[0]?.count ?? 0;

  const role =
    user.organizationRole === PortalRole.Admin ||
    user.organizationRole === PortalRole.Editor ||
    user.organizationRole === PortalRole.Member
      ? user.organizationRole
      : PortalRole.Member;

  if (count === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <ChangelogEmptyState role={role} />
      </div>
    );
  }

  return (
    <ResizablePanelGroup
      className="min-w-0 flex-1"
      direction="horizontal"
      style={{ overflow: "unset" }}
    >
      <ResizablePanel
        className="sticky top-0 h-screen min-w-80"
        defaultSize={30}
        maxSize={35}
        minSize={25}
        style={{ overflow: "auto" }}
      >
        <div className="h-full border-r">
          <Header badge={count} title="Changelog">
            {role === PortalRole.Member ? null : (
              <div className="-m-2">
                <Tooltip align="end" content="Post a new update" side="bottom">
                  <CreateChangelogButton />
                </Tooltip>
              </div>
            )}
          </Header>
          <ChangelogList />
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        className="min-w-0 self-start"
        defaultSize={70}
        style={{ overflow: "unset" }}
      >
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ChangelogLayout;
