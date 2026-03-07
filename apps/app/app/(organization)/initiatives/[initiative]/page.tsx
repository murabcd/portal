import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import { createId } from "@repo/backend/id";
import type { JSONContent } from "@repo/editor";
import { textToContent } from "@repo/editor/lib/tiptap";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createMetadata } from "@/lib/metadata";
import { CreateInitiativeUpdateButton } from "./components/create-initiative-update-button";
import { InitiativeEmoji } from "./components/initiative-emoji";
import { InitiativeFeatures } from "./components/initiative-features";
import { InitiativePageEditor } from "./components/initiative-page-editor";
import { InitiativeQuestionCard } from "./components/initiative-question-card";
import { InitiativeSidebar } from "./components/initiative-sidebar";
import { InitiativeTitle } from "./components/initiative-title";
import { InitiativeUpdatesCard } from "./components/initiative-updates-card";

type InitiativeProperties = {
  readonly params: Promise<{
    readonly initiative: string;
  }>;
};

export const generateMetadata = async (
  props: InitiativeProperties
): Promise<Metadata> => {
  const params = await props.params;
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return {};
  }

  const [initiative] = await database
    .select({ title: tables.initiative.title })
    .from(tables.initiative)
    .where(
      and(
        eq(tables.initiative.id, params.initiative),
        eq(tables.initiative.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!initiative) {
    return {};
  }

  return createMetadata({
    title: initiative.title,
    description: "Create and edit content for your initiative.",
  });
};

const Initiative = async (props: InitiativeProperties) => {
  const params = await props.params;
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    notFound();
  }

  const [initiative] = await database
    .select({
      id: tables.initiative.id,
      title: tables.initiative.title,
      emoji: tables.initiative.emoji,
    })
    .from(tables.initiative)
    .where(
      and(
        eq(tables.initiative.id, params.initiative),
        eq(tables.initiative.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!initiative) {
    notFound();
  }

  const [existingPage] = await database
    .select({ id: tables.initiativePage.id })
    .from(tables.initiativePage)
    .where(
      and(
        eq(tables.initiativePage.initiativeId, params.initiative),
        eq(tables.initiativePage.organizationId, organizationId),
        eq(tables.initiativePage.default, true)
      )
    )
    .limit(1);

  let page = existingPage;

  if (!page) {
    const now = new Date().toISOString();
    const id = createId();
    await database.insert(tables.initiativePage).values({
      id,
      createdAt: now,
      updatedAt: now,
      initiativeId: params.initiative,
      organizationId,
      default: true,
      creatorId: user.id,
      title: initiative.title,
    });

    page = { id };
  }

  let content = await getJsonColumnFromTable(
    "initiative_page",
    "content",
    page.id
  );

  if (!content) {
    const newContent = textToContent("") as JsonValue;

    await database
      .update(tables.initiativePage)
      .set({ content: newContent, updatedAt: new Date().toISOString() })
      .where(eq(tables.initiativePage.id, page.id));

    content = newContent;
  }

  return (
    <div className="flex items-start">
      <div className="flex-1 px-6 py-16">
        <div className="mx-auto grid max-w-prose gap-6">
          <div className="flex items-center justify-between gap-2">
            <InitiativeEmoji
              defaultEmoji={initiative.emoji}
              editable={user.organizationRole !== PortalRole.Member}
              initiativeId={params.initiative}
            />
            <CreateInitiativeUpdateButton
              initiativeId={params.initiative}
              initiativeTitle={initiative.title}
            />
          </div>
          <InitiativeTitle
            defaultTitle={initiative.title}
            editable={user.organizationRole !== PortalRole.Member}
            initiativeId={params.initiative}
          />
          <InitiativeQuestionCard
            initiativeId={params.initiative}
            organizationId={organizationId}
          />
          <InitiativePageEditor
            defaultValue={content as JSONContent}
            editable={user.organizationRole !== PortalRole.Member}
            pageId={page.id}
          />
          <Suspense fallback={null}>
            <InitiativeUpdatesCard initiativeId={params.initiative} />
          </Suspense>
          <Suspense fallback={null}>
            <InitiativeFeatures initiativeId={params.initiative} />
          </Suspense>
        </div>
      </div>
      <InitiativeSidebar initiativeId={params.initiative} />
    </div>
  );
};

export default Initiative;
