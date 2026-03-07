import { FlowniRole } from "@repo/backend/auth";
import { getUserName } from "@repo/backend/auth/format";
import {
  currentMembers,
  currentOrganizationId,
  currentUser,
} from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { Initiative } from "@repo/backend/types";
import { Emoji } from "@repo/design-system/components/emoji";
import { Link } from "@repo/design-system/components/link";
import { formatDate } from "@repo/lib/format";
import { eq } from "drizzle-orm";
import { FileIcon, FilePenIcon, FrameIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { AvatarTooltip } from "@/components/avatar-tooltip";
import {
  Item as SettingsBarItem,
  Root as SettingsBarRoot,
} from "@/components/settings-bar";
import { staticify } from "@/lib/staticify";
import { CreateInitiativeFileButton } from "./create-initiative-file-button";
import { CreateInitiativeLinkButton } from "./create-initiative-link-button";
import { CreateInitiativePageButton } from "./create-initiative-page-button";
import { DeleteExternalInitiativeLinkButton } from "./delete-external-initiative-link-button";
import { DeleteInitiativeFileButton } from "./delete-initiative-file-button";
import { InitiativeExternalLinkButton } from "./initiative-external-link-button";
import { InitiativeLinkDialog } from "./initiative-link-dialog";
import { InitiativeMemberPicker } from "./initiative-member-picker";
import { InitiativeOwnerPicker } from "./initiative-owner-picker";
import { InitiativeSettingsDropdown } from "./initiative-settings-dropdown";
import { InitiativeStatusPicker } from "./initiative-status-picker";

type InitiativeSidebarProperties = {
  readonly initiativeId: Initiative["id"];
};

type SidebarMember = Awaited<ReturnType<typeof currentMembers>>[number];
type SidebarPage = {
  id: string;
  title: string;
  default: boolean;
};
type SidebarCanvas = {
  id: string;
  title: string;
};
type SidebarTeamMember = {
  userId: string;
};
type SidebarExternalLink = {
  id: string;
  href: string;
  title: string;
};
type SidebarFile = {
  id: string;
  name: string;
  url: string;
};
type SidebarFeatureLink = {
  id: string;
  title: string;
  status: { color: string };
  initiatives: { id: string }[];
};
type SidebarGroupLink = {
  id: string;
  name: string;
  emoji: string;
  initiatives: { id: string }[];
};
type SidebarProductLink = {
  id: string;
  name: string;
  emoji: string;
  initiatives: { id: string }[];
};

const InitiativeTeamSection = ({
  canEdit,
  initiativeId,
  members,
  team,
}: {
  canEdit: boolean;
  initiativeId: string;
  members: SidebarMember[];
  team: SidebarTeamMember[];
}) => (
  <SettingsBarItem
    action={
      canEdit ? (
        <InitiativeMemberPicker
          defaultMembers={team.map(({ userId }) => userId)}
          initiativeId={initiativeId}
          users={staticify(members)}
        />
      ) : null
    }
    title="Team"
  >
    <div className="flex flex-wrap items-center gap-1">
      {team.map((member) => {
        const memberUser = members.find(
          (candidate) => candidate.id === member.userId
        );

        if (!memberUser) {
          return null;
        }

        return (
          <AvatarTooltip
            fallback={getUserName(memberUser).slice(0, 2)}
            key={member.userId}
            src={memberUser.image ?? undefined}
            subtitle={memberUser.email ?? ""}
            title={getUserName(memberUser)}
          />
        );
      })}
    </div>
  </SettingsBarItem>
);

const InitiativeLinksSection = ({
  canEdit,
  externalLinks,
  initiativeId,
}: {
  canEdit: boolean;
  externalLinks: SidebarExternalLink[];
  initiativeId: string;
}) => (
  <SettingsBarItem
    action={
      canEdit ? (
        <CreateInitiativeLinkButton initiativeId={initiativeId} />
      ) : null
    }
    title="Links"
  >
    <div className="flex flex-col gap-2">
      {externalLinks.map((link) => (
        <div className="flex items-center justify-between gap-4" key={link.id}>
          <InitiativeExternalLinkButton {...link} />
          {canEdit ? <DeleteExternalInitiativeLinkButton id={link.id} /> : null}
        </div>
      ))}
    </div>
  </SettingsBarItem>
);

const InitiativePagesSection = ({
  canEdit,
  canvases,
  initiativeId,
  pages,
}: {
  canEdit: boolean;
  canvases: SidebarCanvas[];
  initiativeId: string;
  pages: SidebarPage[];
}) => (
  <SettingsBarItem
    action={
      canEdit ? (
        <CreateInitiativePageButton initiativeId={initiativeId} />
      ) : null
    }
    title="Pages"
  >
    <div className="flex flex-col gap-2">
      {pages
        .filter((page) => !page.default)
        .map((page) => (
          <Link
            className="group flex items-center gap-1.5 font-medium text-xs"
            href={`/initiatives/${initiativeId}/${page.id}`}
            key={page.id}
          >
            <FilePenIcon size={16} />
            <span className="w-full truncate group-hover:underline">
              {page.title}
            </span>
          </Link>
        ))}
      {canvases.map((page) => (
        <Link
          className="group flex items-center gap-1.5 font-medium text-xs"
          href={`/initiatives/${initiativeId}/${page.id}`}
          key={page.id}
        >
          <FrameIcon size={16} />
          <span className="w-full truncate group-hover:underline">
            {page.title}
          </span>
        </Link>
      ))}
    </div>
  </SettingsBarItem>
);

const InitiativeFilesSection = ({
  canEdit,
  files,
  initiativeId,
}: {
  canEdit: boolean;
  files: SidebarFile[];
  initiativeId: string;
}) => (
  <SettingsBarItem
    action={
      canEdit ? (
        <CreateInitiativeFileButton initiativeId={initiativeId} />
      ) : null
    }
    title="Files"
  >
    <div className="flex flex-col gap-2">
      {files.map((file) => (
        <div className="flex items-center justify-between gap-4" key={file.id}>
          <Link
            className="group flex items-center gap-1.5 font-medium text-xs"
            href={file.url}
          >
            <FileIcon size={16} />
            <span className="w-full truncate group-hover:underline">
              {file.name}
            </span>
          </Link>
          {canEdit ? <DeleteInitiativeFileButton id={file.id} /> : null}
        </div>
      ))}
    </div>
  </SettingsBarItem>
);

const InitiativeConnectionsSection = ({
  canEdit,
  featuresWithLinks,
  groupsWithLinks,
  initiativeId,
  productsWithLinks,
}: {
  canEdit: boolean;
  featuresWithLinks: SidebarFeatureLink[];
  groupsWithLinks: SidebarGroupLink[];
  initiativeId: string;
  productsWithLinks: SidebarProductLink[];
}) => (
  <SettingsBarItem
    action={
      canEdit ? (
        <InitiativeLinkDialog
          features={featuresWithLinks.filter(
            (feature) =>
              !feature.initiatives.some(
                (linkedInitiative) => linkedInitiative.id === initiativeId
              )
          )}
          groups={groupsWithLinks.filter(
            (group) =>
              !group.initiatives.some(
                (linkedInitiative) => linkedInitiative.id === initiativeId
              )
          )}
          initiativeId={initiativeId}
          products={productsWithLinks.filter(
            (product) =>
              !product.initiatives.some(
                (linkedInitiative) => linkedInitiative.id === initiativeId
              )
          )}
        />
      ) : null
    }
    title="Connections"
  >
    <div className="flex flex-col gap-2">
      {featuresWithLinks
        .filter((feature) =>
          feature.initiatives.some(
            (linkedInitiative) => linkedInitiative.id === initiativeId
          )
        )
        .map((feature) => (
          <Link
            className="group flex items-center gap-1.5 font-medium text-xs"
            href={`/features/${feature.id}`}
            key={feature.id}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: feature.status.color }}
              />
            </span>
            <span className="w-full truncate group-hover:underline">
              {feature.title}
            </span>
          </Link>
        ))}
      {groupsWithLinks
        .filter((group) =>
          group.initiatives.some(
            (linkedInitiative) => linkedInitiative.id === initiativeId
          )
        )
        .map((group) => (
          <Link
            className="group flex items-center gap-1.5 font-medium text-xs"
            href={`/features/groups/${group.id}`}
            key={group.id}
          >
            <div className="flex h-4 w-4 items-center justify-center">
              <Emoji id={group.emoji} size="0.825rem" />
            </div>
            <span className="w-full truncate group-hover:underline">
              {group.name}
            </span>
          </Link>
        ))}
      {productsWithLinks
        .filter((product) =>
          product.initiatives.some(
            (linkedInitiative) => linkedInitiative.id === initiativeId
          )
        )
        .map((product) => (
          <Link
            className="group flex items-center gap-1.5 font-medium text-xs"
            href={`/features/products/${product.id}`}
            key={product.id}
          >
            <div className="flex h-4 w-4 items-center justify-center">
              <Emoji id={product.emoji} size="0.825rem" />
            </div>
            <span className="w-full truncate group-hover:underline">
              {product.name}
            </span>
          </Link>
        ))}
    </div>
  </SettingsBarItem>
);

export const InitiativeSidebar = async ({
  initiativeId,
}: InitiativeSidebarProperties) => {
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    notFound();
  }

  const [
    initiativeRows,
    pages,
    canvases,
    team,
    externalLinks,
    files,
    members,
    features,
    groups,
    products,
    featureLinks,
    groupLinks,
    productLinks,
  ] = await Promise.all([
    database
      .select({
        id: tables.initiative.id,
        createdAt: tables.initiative.createdAt,
        ownerId: tables.initiative.ownerId,
        state: tables.initiative.state,
      })
      .from(tables.initiative)
      .where(eq(tables.initiative.id, initiativeId))
      .limit(1),
    database
      .select({
        id: tables.initiativePage.id,
        title: tables.initiativePage.title,
        default: tables.initiativePage.default,
      })
      .from(tables.initiativePage)
      .where(eq(tables.initiativePage.initiativeId, initiativeId)),
    database
      .select({
        id: tables.initiativeCanvas.id,
        title: tables.initiativeCanvas.title,
      })
      .from(tables.initiativeCanvas)
      .where(eq(tables.initiativeCanvas.initiativeId, initiativeId)),
    database
      .select({ userId: tables.initiativeMember.userId })
      .from(tables.initiativeMember)
      .where(eq(tables.initiativeMember.initiativeId, initiativeId)),
    database
      .select({
        id: tables.initiativeExternalLink.id,
        href: tables.initiativeExternalLink.href,
        title: tables.initiativeExternalLink.title,
      })
      .from(tables.initiativeExternalLink)
      .where(eq(tables.initiativeExternalLink.initiativeId, initiativeId)),
    database
      .select({
        id: tables.initiativeFile.id,
        name: tables.initiativeFile.name,
        url: tables.initiativeFile.url,
      })
      .from(tables.initiativeFile)
      .where(eq(tables.initiativeFile.initiativeId, initiativeId)),
    currentMembers(),
    database
      .select({
        id: tables.feature.id,
        title: tables.feature.title,
        statusColor: tables.featureStatus.color,
      })
      .from(tables.feature)
      .innerJoin(
        tables.featureStatus,
        eq(tables.feature.statusId, tables.featureStatus.id)
      )
      .where(eq(tables.feature.organizationId, organizationId)),
    database
      .select({
        id: tables.group.id,
        name: tables.group.name,
        emoji: tables.group.emoji,
      })
      .from(tables.group)
      .where(eq(tables.group.organizationId, organizationId)),
    database
      .select({
        id: tables.product.id,
        name: tables.product.name,
        emoji: tables.product.emoji,
      })
      .from(tables.product)
      .where(eq(tables.product.organizationId, organizationId)),
    database
      .select({ featureId: tables.featureToInitiative.a })
      .from(tables.featureToInitiative)
      .where(eq(tables.featureToInitiative.b, initiativeId)),
    database
      .select({ groupId: tables.groupToInitiative.a })
      .from(tables.groupToInitiative)
      .where(eq(tables.groupToInitiative.b, initiativeId)),
    database
      .select({ productId: tables.initiativeToProduct.b })
      .from(tables.initiativeToProduct)
      .where(eq(tables.initiativeToProduct.a, initiativeId)),
  ]);

  const initiative = initiativeRows[0];

  if (!initiative) {
    notFound();
  }

  const linkedFeatureIds = new Set(featureLinks.map((row) => row.featureId));
  const linkedGroupIds = new Set(groupLinks.map((row) => row.groupId));
  const linkedProductIds = new Set(productLinks.map((row) => row.productId));

  const featuresWithLinks = features.map((feature) => ({
    id: feature.id,
    title: feature.title,
    status: { color: feature.statusColor },
    initiatives: linkedFeatureIds.has(feature.id) ? [{ id: initiativeId }] : [],
  }));

  const groupsWithLinks = groups.map((group) => ({
    ...group,
    initiatives: linkedGroupIds.has(group.id) ? [{ id: initiativeId }] : [],
  }));

  const productsWithLinks = products.map((product) => ({
    ...product,
    initiatives: linkedProductIds.has(product.id) ? [{ id: initiativeId }] : [],
  }));
  const canEdit = user.organizationRole !== FlowniRole.Member;
  const isMember = user.organizationRole === FlowniRole.Member;

  return (
    <SettingsBarRoot>
      {canEdit && <InitiativeSettingsDropdown initiativeId={initiativeId} />}
      <SettingsBarItem title="Created">
        <p className="text-sm">{formatDate(new Date(initiative.createdAt))}</p>
      </SettingsBarItem>

      <SettingsBarItem title="Owner">
        <InitiativeOwnerPicker
          data={members}
          defaultValue={initiative.ownerId}
          disabled={isMember}
          initiativeId={initiativeId}
        />
      </SettingsBarItem>

      <SettingsBarItem title="Status">
        <InitiativeStatusPicker
          defaultValue={initiative.state}
          disabled={isMember}
          initiativeId={initiativeId}
        />
      </SettingsBarItem>
      <InitiativeTeamSection
        canEdit={canEdit}
        initiativeId={initiativeId}
        members={members}
        team={team}
      />
      <InitiativeLinksSection
        canEdit={canEdit}
        externalLinks={externalLinks}
        initiativeId={initiativeId}
      />
      <InitiativePagesSection
        canEdit={canEdit}
        canvases={canvases}
        initiativeId={initiativeId}
        pages={pages}
      />
      <InitiativeFilesSection
        canEdit={canEdit}
        files={files}
        initiativeId={initiativeId}
      />
      <InitiativeConnectionsSection
        canEdit={canEdit}
        featuresWithLinks={featuresWithLinks}
        groupsWithLinks={groupsWithLinks}
        initiativeId={initiativeId}
        productsWithLinks={productsWithLinks}
      />
    </SettingsBarRoot>
  );
};
