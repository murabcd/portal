import { PortalRole } from "@repo/backend/auth";
import {
  currentMembers,
  currentOrganizationId,
  currentUser,
} from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { Link } from "@repo/design-system/components/link";
import { StackCard } from "@repo/design-system/components/stack-card";
import { Button } from "@repo/design-system/components/ui/button";
import { eq } from "drizzle-orm";
import { TablePropertiesIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/metadata";
import { ReleaseDatePicker } from "./components/release-date-picker";
import { ReleaseFeature } from "./components/release-feature";
import { ReleaseSettingsDropdown } from "./components/release-settings-dropdown";
import { ReleaseStatePicker } from "./components/release-state-picker";
import { ReleaseTitle } from "./components/release-title";

type ReleasePageProps = {
  params: Promise<{
    release: string;
  }>;
};

export const metadata: Metadata = createMetadata({
  title: "Release",
  description: "View details about a release.",
});

const ReleasePage = async (props: ReleasePageProps) => {
  const params = await props.params;
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    return notFound();
  }

  const [release, features, members] = await Promise.all([
    database
      .select({
        id: tables.release.id,
        title: tables.release.title,
        startAt: tables.release.startAt,
        endAt: tables.release.endAt,
        state: tables.release.state,
      })
      .from(tables.release)
      .where(eq(tables.release.id, params.release))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    database
      .select({ id: tables.feature.id, ownerId: tables.feature.ownerId })
      .from(tables.feature)
      .where(eq(tables.feature.releaseId, params.release)),
    currentMembers(),
  ]);

  if (!release) {
    return notFound();
  }

  return (
    <div className="px-6 py-16">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <div className="flex items-start justify-between gap-3">
          <ReleaseTitle
            defaultTitle={release.title}
            editable={user.organizationRole !== PortalRole.Member}
            releaseId={release.id}
          />
          {user.organizationRole !== PortalRole.Member && (
            <ReleaseSettingsDropdown releaseId={release.id} />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <ReleaseStatePicker
              defaultValue={release.state}
              disabled={user.organizationRole === PortalRole.Member}
              releaseId={release.id}
            />
          </div>
          <div>
            <ReleaseDatePicker
              defaultEndAt={release.endAt}
              defaultStartAt={release.startAt}
              disabled={user.organizationRole === PortalRole.Member}
              releaseId={release.id}
            />
          </div>
        </div>
        {features.length ? (
          <StackCard
            className="not-prose space-y-4"
            icon={TablePropertiesIcon}
            title="Features"
          >
            {features.map((feature) => (
              <ReleaseFeature
                id={feature.id}
                key={feature.id}
                owner={members.find((member) => member.id === feature.ownerId)}
              />
            ))}
          </StackCard>
        ) : (
          <>
            <p>
              This release doesn't have any features yet! Head over to your
              feature backlog to assign some.
            </p>
            {user.organizationRole !== PortalRole.Member && (
              <Button asChild className="w-fit" variant="outline">
                <Link className="no-underline" href="/features">
                  Browse features
                </Link>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReleasePage;
