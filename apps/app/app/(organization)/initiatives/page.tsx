import emojiData from "@emoji-mart/data";
import { PortalRole } from "@repo/backend/auth";
import {
  currentMembers,
  currentOrganizationId,
  currentUser,
} from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { and, desc, eq, inArray } from "drizzle-orm";
import { init } from "emoji-mart";
import { CompassIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { createMetadata } from "@/lib/metadata";
import { toMemberInfoList } from "@/lib/serialization";
import { CreateInitiativeButton } from "./components/create-initiative-button";
import { InitiativeItem } from "./components/initiative-item";
import { InitiativesEmptyState } from "./components/initiatives-empty-state";

init({ data: emojiData });

const title = "Initiatives";
const description = "Create and manage initiatives for your product.";

export const metadata: Metadata = createMetadata({
  title,
  description,
});

const Initiatives = async () => {
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    notFound();
  }

  const [initiativeRows, members] = await Promise.all([
    database
      .select({
        id: tables.initiative.id,
        title: tables.initiative.title,
        emoji: tables.initiative.emoji,
        state: tables.initiative.state,
      })
      .from(tables.initiative)
      .where(eq(tables.initiative.organizationId, organizationId))
      .orderBy(desc(tables.initiative.createdAt)),
    currentMembers(),
  ]);
  const membersLite = toMemberInfoList(members);

  const initiativeIds = initiativeRows.map((initiative) => initiative.id);
  const [teamRows, pageRows] = await Promise.all([
    initiativeIds.length === 0
      ? []
      : await database
          .select({
            userId: tables.initiativeMember.userId,
            initiativeId: tables.initiativeMember.initiativeId,
          })
          .from(tables.initiativeMember)
          .where(inArray(tables.initiativeMember.initiativeId, initiativeIds)),
    initiativeIds.length === 0
      ? []
      : await database
          .select({
            id: tables.initiativePage.id,
            initiativeId: tables.initiativePage.initiativeId,
            createdAt: tables.initiativePage.createdAt,
          })
          .from(tables.initiativePage)
          .where(
            and(
              inArray(tables.initiativePage.initiativeId, initiativeIds),
              eq(tables.initiativePage.default, true)
            )
          )
          .orderBy(desc(tables.initiativePage.createdAt)),
  ]);

  const teamByInitiative = new Map<string, { userId: string }[]>();
  for (const row of teamRows) {
    const existing = teamByInitiative.get(row.initiativeId) ?? [];
    existing.push({ userId: row.userId });
    teamByInitiative.set(row.initiativeId, existing);
  }

  const pageByInitiative = new Map<string, { id: string }>();
  for (const row of pageRows) {
    if (!pageByInitiative.has(row.initiativeId)) {
      pageByInitiative.set(row.initiativeId, { id: row.id });
    }
  }

  const initiatives = initiativeRows.map((initiative) => {
    const page = pageByInitiative.get(initiative.id);

    return {
      ...initiative,
      team: teamByInitiative.get(initiative.id) ?? [],
      pages: page ? [page] : [],
    };
  });

  if (initiatives.length === 0 && user.organizationRole === PortalRole.Member) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <EmptyState
          description="Initiatives are a way to organize your product development efforts."
          icon={CompassIcon}
          title="You don't have any initiatives"
        />
      </div>
    );
  }

  if (initiatives.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <InitiativesEmptyState />
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
            <CreateInitiativeButton />
          )}
        </div>
        <div className="mt-8 divide-y">
          {[...initiatives]
            .sort((initiativeA, initiativeB) => {
              const stateOrder = [
                "ACTIVE",
                "PLANNED",
                "COMPLETED",
                "CANCELLED",
              ];
              const stateA = stateOrder.indexOf(initiativeA.state);
              const stateB = stateOrder.indexOf(initiativeB.state);

              if (stateA !== stateB) {
                return stateA - stateB;
              }

              // If states are the same, sort by title
              return initiativeA.title.localeCompare(initiativeB.title);
            })
            .map((initiative) => (
              <InitiativeItem
                initiative={initiative}
                key={initiative.id}
                members={membersLite.filter((member) =>
                  initiative.team.some((team) => team.userId === member.id)
                )}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Initiatives;
