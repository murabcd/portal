import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { createMetadata } from "@repo/lib/metadata";
import { desc, eq } from "drizzle-orm";
import { FlagIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { CreateReleaseButton } from "./components/create-release-button";
import { ReleaseItem } from "./components/release-item";

const title = "Releases";
const description = "Create and manage software versions";

export const metadata: Metadata = createMetadata({
  title,
  description,
});

const Releases = async () => {
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    return notFound();
  }

  const releases = await database
    .select({
      id: tables.release.id,
      title: tables.release.title,
      startAt: tables.release.startAt,
      endAt: tables.release.endAt,
      state: tables.release.state,
      jiraId: tables.release.jiraId,
    })
    .from(tables.release)
    .where(eq(tables.release.organizationId, organizationId))
    .orderBy(desc(tables.release.startAt), desc(tables.release.title));

  if (!releases.length && user.organizationRole === PortalRole.Member) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          description="Releases are a way to communicate with your team about changes to your product."
          icon={FlagIcon}
          title="You don't have any releases"
        />
      </div>
    );
  }

  if (!releases.length) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          description="Releases are a way to communicate with your team about changes to your product."
          icon={FlagIcon}
          title="Create your first release"
        >
          <CreateReleaseButton />
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="px-6 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-2">
            <h1 className="m-0 font-semibold text-4xl tracking-tight">
              {title}
            </h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {user.organizationRole !== PortalRole.Member && (
            <CreateReleaseButton />
          )}
        </div>
        <div className="mt-8 divide-y">
          {releases.map((release) => (
            <ReleaseItem key={release.id} release={release} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Releases;
