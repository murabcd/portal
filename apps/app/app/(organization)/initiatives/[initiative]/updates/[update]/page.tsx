import { PortalRole } from "@repo/backend/auth";
import { getUserName } from "@repo/backend/auth/format";
import {
  currentMembers,
  currentOrganizationId,
  currentUser,
} from "@repo/backend/auth/utils";
import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import type { Initiative, InitiativeUpdate } from "@repo/backend/types";
import { StackCard } from "@repo/design-system/components/stack-card";
import { Button } from "@repo/design-system/components/ui/button";
import type { JSONContent } from "@repo/editor";
import { contentToHtml, contentToText } from "@repo/editor/lib/tiptap";
import { formatDate } from "@repo/lib/format";
import { createMetadata } from "@repo/lib/metadata";
import { and, eq } from "drizzle-orm";
import { SendIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { InitiativeUpdateCopyContentButton } from "./components/initiative-update-copy-content-button";
import { InitiativeUpdateEditor } from "./components/initiative-update-editor";
import { UpdateEmptyState } from "./components/initiative-update-empty-state";
import { InitiativeUpdateSendButton } from "./components/initiative-update-send-button";
import { InitiativeUpdateTitle } from "./components/initiative-update-title";

type InitiativeUpdatePageProperties = {
  readonly params: Promise<{
    readonly initiative: Initiative["id"];
    readonly update: InitiativeUpdate["id"];
  }>;
};

export const dynamic = "force-dynamic";

export const generateMetadata = async (
  props: InitiativeUpdatePageProperties
): Promise<Metadata> => {
  const params = await props.params;
  const [update] = await database
    .select({
      id: tables.initiativeUpdate.id,
      title: tables.initiativeUpdate.title,
    })
    .from(tables.initiativeUpdate)
    .where(eq(tables.initiativeUpdate.id, params.update))
    .limit(1);

  if (!update) {
    return {};
  }

  const content = await getJsonColumnFromTable(
    "initiative_update",
    "content",
    update.id
  );
  const text = content ? contentToText(content) : "No content yet.";

  return createMetadata({
    title: update.title,
    description: text.slice(0, 150),
  });
};

const InitiativeUpdatePage = async (props: InitiativeUpdatePageProperties) => {
  const params = await props.params;
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    notFound();
  }

  const [updateRows, members, organizationRows] = await Promise.all([
    database
      .select({
        id: tables.initiativeUpdate.id,
        title: tables.initiativeUpdate.title,
        emailSentAt: tables.initiativeUpdate.emailSentAt,
        slackSentAt: tables.initiativeUpdate.slackSentAt,
        initiativeId: tables.initiativeUpdate.initiativeId,
      })
      .from(tables.initiativeUpdate)
      .where(
        and(
          eq(tables.initiativeUpdate.id, params.update),
          eq(tables.initiativeUpdate.organizationId, organizationId)
        )
      )
      .limit(1),
    currentMembers(),
    database
      .select({ id: tables.organization.id })
      .from(tables.organization)
      .where(eq(tables.organization.id, organizationId))
      .limit(1),
  ]);

  const update = updateRows[0];
  const organization = organizationRows[0];

  if (!(update && organization)) {
    notFound();
  }

  const content = await getJsonColumnFromTable(
    "initiative_update",
    "content",
    update.id
  );

  if (!(content && Object.keys(content).length)) {
    return (
      <div className="px-6 py-16">
        <div className="mx-auto grid max-w-prose gap-8">
          <InitiativeUpdateTitle
            defaultTitle={update.title}
            editable={user.organizationRole !== PortalRole.Member}
            initiativeUpdateId={params.update}
          />
          <UpdateEmptyState
            initiativeId={params.initiative}
            initiativeUpdateId={params.update}
          />
        </div>
      </div>
    );
  }

  const html = await contentToHtml(content);
  const text = contentToText(content);
  const teamRows = await database
    .select({ userId: tables.initiativeMember.userId })
    .from(tables.initiativeMember)
    .where(eq(tables.initiativeMember.initiativeId, update.initiativeId));

  const recipients = members.filter((member) =>
    teamRows.some((team) => team.userId === member.id)
  );
  const hasContent = Boolean(content) && Object.keys(content).length > 0;

  return (
    <div className="px-6 py-16">
      <div className="mx-auto grid max-w-prose gap-6">
        <div className="grid gap-3">
          <div className="flex items-start justify-between gap-2">
            <p className="m-0 text-muted-foreground text-sm">Subject</p>
            <div className="flex items-center -space-x-1">
              {recipients.map((recipient) =>
                recipient.image ? (
                  <Image
                    alt={getUserName(recipient)}
                    className="h-6 w-6 shrink-0 overflow-hidden rounded-full border-2 border-backdrop object-cover"
                    height={24}
                    key={recipient.id}
                    src={recipient.image}
                    width={24}
                  />
                ) : null
              )}
            </div>
          </div>
          <div className="flex items-start justify-between gap-2">
            <InitiativeUpdateTitle
              defaultTitle={update.title}
              editable={user.organizationRole !== PortalRole.Member}
              initiativeUpdateId={params.update}
            />
            {update.emailSentAt ? (
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  className="flex items-center gap-2"
                  disabled
                  variant="outline"
                >
                  <SendIcon size={16} />
                  Sent {formatDate(new Date(update.emailSentAt))}
                </Button>
                <InitiativeUpdateCopyContentButton html={html} text={text} />
              </div>
            ) : (
              <InitiativeUpdateSendButton
                recipientCount={recipients.length}
                updateId={params.update}
              />
            )}
          </div>
        </div>
        <StackCard className="grid gap-8 px-6 py-12">
          {hasContent ? (
            <InitiativeUpdateEditor
              defaultValue={content as JSONContent}
              editable={user.organizationRole !== PortalRole.Member}
              initiativeUpdateId={params.update}
            />
          ) : (
            <UpdateEmptyState
              initiativeId={params.initiative}
              initiativeUpdateId={params.update}
            />
          )}
        </StackCard>
      </div>
    </div>
  );
};

export default InitiativeUpdatePage;
