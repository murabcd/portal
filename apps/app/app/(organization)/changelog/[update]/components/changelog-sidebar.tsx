import { PortalRole } from "@repo/backend/auth";
import { getUserName } from "@repo/backend/auth/format";
import { currentMembers, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { Changelog } from "@repo/backend/types";
import { Badge } from "@repo/design-system/components/ui/badge";
import { formatDate } from "@repo/lib/format";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AvatarTooltip } from "@/components/avatar-tooltip";
import {
  Item as SettingsBarItem,
  Root as SettingsBarRoot,
} from "@/components/settings-bar";
import { staticify } from "@/lib/staticify";
import { ChangelogContributorsPicker } from "./changelog-contributors-picker";
import { ChangelogDatePicker } from "./changelog-date-picker";
import { ChangelogSettingsDropdown } from "./changelog-settings-dropdown";
import { ChangelogSlugInput } from "./changelog-slug-input";
import { ChangelogStatusPicker } from "./changelog-status-picker";
import { ChangelogTagsPicker } from "./changelog-tags-picker";

type ChangelogSidebarProperties = {
  readonly changelogId: Changelog["id"];
};

export const ChangelogSidebar = async ({
  changelogId,
}: ChangelogSidebarProperties) => {
  const [user, changelogRows, members, changelogTags, contributors, tags] =
    await Promise.all([
      currentUser(),
      database
        .select({
          id: tables.changelog.id,
          createdAt: tables.changelog.createdAt,
          publishAt: tables.changelog.publishAt,
          slug: tables.changelog.slug,
          status: tables.changelog.status,
        })
        .from(tables.changelog)
        .where(eq(tables.changelog.id, changelogId))
        .limit(1),
      currentMembers(),
      database
        .select({ id: tables.changelogTag.id, name: tables.changelogTag.name })
        .from(tables.changelogTag),
      database
        .select({ userId: tables.changelogContributor.userId })
        .from(tables.changelogContributor)
        .where(eq(tables.changelogContributor.changelogId, changelogId)),
      database
        .select({
          id: tables.changelogTag.id,
          name: tables.changelogTag.name,
        })
        .from(tables.changelogTag)
        .innerJoin(
          tables.changelogToChangelogTag,
          eq(tables.changelogToChangelogTag.b, tables.changelogTag.id)
        )
        .where(eq(tables.changelogToChangelogTag.a, changelogId)),
    ]);

  const changelog = changelogRows[0];

  if (!(user && changelog)) {
    notFound();
  }

  return (
    <SettingsBarRoot>
      {user.organizationRole !== PortalRole.Member && (
        <ChangelogSettingsDropdown changelogId={changelogId} />
      )}

      <SettingsBarItem title="Created">
        <p className="text-sm">{formatDate(new Date(changelog.createdAt))}</p>
      </SettingsBarItem>

      <SettingsBarItem title="Publish Date">
        <ChangelogDatePicker
          changelogId={changelog.id}
          defaultPublishAt={changelog.publishAt}
          disabled={user.organizationRole === PortalRole.Member}
        />
      </SettingsBarItem>

      <SettingsBarItem
        action={
          user.organizationRole !== PortalRole.Member && (
            <ChangelogContributorsPicker
              changelogId={changelog.id}
              defaultContributors={contributors.map(({ userId }) => userId)}
              users={staticify(members)}
            />
          )
        }
        title="Contributors"
      >
        <div className="flex flex-wrap items-center gap-1">
          {contributors.map((contributor) => {
            const memberUser = members.find(
              (member) => member.id === contributor.userId
            );

            if (!memberUser) {
              return null;
            }

            return (
              <AvatarTooltip
                fallback={getUserName(memberUser).slice(0, 2)}
                key={contributor.userId}
                src={memberUser.image ?? undefined}
                subtitle={memberUser.email ?? ""}
                title={getUserName(memberUser)}
              />
            );
          })}
        </div>
      </SettingsBarItem>

      <SettingsBarItem title="Status">
        <ChangelogStatusPicker
          changelogId={changelog.id}
          defaultValue={changelog.status}
          disabled={user.organizationRole === PortalRole.Member}
        />
      </SettingsBarItem>

      <SettingsBarItem title="Slug">
        <ChangelogSlugInput
          changelogId={changelog.id}
          defaultValue={changelog.slug ?? null}
          disabled={user.organizationRole === PortalRole.Member}
        />
      </SettingsBarItem>

      <SettingsBarItem
        action={
          user.organizationRole !== PortalRole.Member && (
            <ChangelogTagsPicker
              changelogId={changelog.id}
              defaultTags={tags.map(({ id }) => id)}
              storedTags={changelogTags}
            />
          )
        }
        title="Tags"
      >
        <div className="flex flex-wrap items-center gap-1">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="outline">
              {tag.name}
            </Badge>
          ))}
        </div>
      </SettingsBarItem>
    </SettingsBarRoot>
  );
};
