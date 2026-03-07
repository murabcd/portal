import { currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { InitiativeUpdate } from "@repo/backend/types";
import { Link } from "@repo/design-system/components/link";
import { StackCard } from "@repo/design-system/components/stack-card";
import { Separator } from "@repo/design-system/components/ui/separator";
import { colors } from "@repo/design-system/lib/colors";
import { formatDate } from "@repo/lib/format";
import { eq } from "drizzle-orm";
import { NewspaperIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { CreateInitiativeUpdateButton } from "./create-initiative-update-button";

const getColor = (
  update: Pick<
    InitiativeUpdate,
    "sendEmail" | "sendSlack" | "emailSentAt" | "slackSentAt"
  >
) => {
  // Not sending to any channels
  if (!(update.sendEmail || update.sendSlack)) {
    return colors.gray;
  }

  // If sending to both channels...
  if (update.sendEmail && update.sendSlack) {
    // If both have been sent
    if (update.emailSentAt && update.slackSentAt) {
      return colors.emerald;
    }
    // If one has been sent
    return colors.amber;
  }

  // If sending to email only
  if (update.emailSentAt) {
    if (update.sendEmail) {
      return colors.emerald;
    }
    return colors.amber;
  }

  // If sending to slack only
  if (update.slackSentAt && update.sendSlack) {
    if (update.sendSlack) {
      return colors.emerald;
    }
    return colors.amber;
  }

  // If not sending to any channels
  return colors.gray;
};

export const InitiativeUpdatesCard = async ({
  initiativeId,
}: {
  initiativeId: string;
}) => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const [initiativeRows, updates] = await Promise.all([
    database
      .select({
        ownerId: tables.initiative.ownerId,
        title: tables.initiative.title,
      })
      .from(tables.initiative)
      .where(eq(tables.initiative.id, initiativeId))
      .limit(1),
    database
      .select({
        id: tables.initiativeUpdate.id,
        title: tables.initiativeUpdate.title,
        sendEmail: tables.initiativeUpdate.sendEmail,
        sendSlack: tables.initiativeUpdate.sendSlack,
        emailSentAt: tables.initiativeUpdate.emailSentAt,
        slackSentAt: tables.initiativeUpdate.slackSentAt,
      })
      .from(tables.initiativeUpdate)
      .where(eq(tables.initiativeUpdate.initiativeId, initiativeId)),
  ]);

  const initiative = initiativeRows[0];

  if (!initiative) {
    return null;
  }

  if (!updates.length && user.id !== initiative.ownerId) {
    return (
      <StackCard className="not-prose p-8" icon={NewspaperIcon} title="Updates">
        <EmptyState
          compact
          description="No updates have been sent for this initiative yet."
          title="No updates"
        />
      </StackCard>
    );
  }

  if (!updates.length) {
    return (
      <StackCard className="not-prose p-8" icon={NewspaperIcon} title="Updates">
        <EmptyState
          compact
          description="Send an update to all members on the initiative."
          title="Send your first update"
        >
          <CreateInitiativeUpdateButton
            initiativeId={initiativeId}
            initiativeTitle={initiative.title}
          />
        </EmptyState>
      </StackCard>
    );
  }

  return (
    <StackCard
      className="max-h-[20rem] w-full overflow-y-auto p-2"
      icon={NewspaperIcon}
      title="Updates"
    >
      {updates.map((update) => (
        <Link
          className="flex items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-card"
          href={`/initiatives/${initiativeId}/updates/${update.id}`}
          key={update.id}
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: getColor(update) }}
          />
          <span className="flex-1 truncate font-medium text-sm">
            {update.title}
          </span>
          {update.emailSentAt ? (
            <span className="text-muted-foreground text-xs">
              Sent at {formatDate(new Date(update.emailSentAt))}
            </span>
          ) : null}
        </Link>
      ))}
      <Separator className="my-2" />
      <CreateInitiativeUpdateButton
        initiativeId={initiativeId}
        initiativeTitle={initiative.title}
      />
    </StackCard>
  );
};
