import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import type { CanvasState } from "@repo/canvas";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/metadata";
import { InitiativeCanvasLoader } from "../components/initiative-canvas";
import { InitiativeCanvasDropdown } from "../components/initiative-canvas-dropdown";
import { InitiativePageEditor } from "../components/initiative-page-editor";
import { InitiativePageTitle } from "../components/initiative-page-title";

type InitiativeProperties = {
  readonly params: Promise<{
    readonly initiative: string;
    readonly page: string;
  }>;
};

export const generateMetadata = async (
  props: InitiativeProperties
): Promise<Metadata> => {
  const params = await props.params;
  const [pageRows, canvasRows] = await Promise.all([
    database
      .select({ title: tables.initiativePage.title })
      .from(tables.initiativePage)
      .where(
        and(
          eq(tables.initiativePage.id, params.page),
          eq(tables.initiativePage.initiativeId, params.initiative)
        )
      )
      .limit(1),
    database
      .select({ title: tables.initiativeCanvas.title })
      .from(tables.initiativeCanvas)
      .where(
        and(
          eq(tables.initiativeCanvas.id, params.page),
          eq(tables.initiativeCanvas.initiativeId, params.initiative)
        )
      )
      .limit(1),
  ]);

  const page = pageRows[0];
  const canvas = canvasRows[0];

  const resolvedPage = page ?? canvas;

  if (!resolvedPage) {
    return {};
  }

  return createMetadata({
    title: resolvedPage.title,
    description: "A page in an initiative",
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

  const [pageRows, canvasRows, organizationRows] = await Promise.all([
    database
      .select({
        id: tables.initiativePage.id,
        title: tables.initiativePage.title,
      })
      .from(tables.initiativePage)
      .where(
        and(
          eq(tables.initiativePage.id, params.page),
          eq(tables.initiativePage.initiativeId, params.initiative)
        )
      )
      .limit(1),
    database
      .select({
        id: tables.initiativeCanvas.id,
        title: tables.initiativeCanvas.title,
      })
      .from(tables.initiativeCanvas)
      .where(
        and(
          eq(tables.initiativeCanvas.id, params.page),
          eq(tables.initiativeCanvas.initiativeId, params.initiative)
        )
      )
      .limit(1),
    database
      .select({ id: tables.organization.id })
      .from(tables.organization)
      .where(eq(tables.organization.id, organizationId))
      .limit(1),
  ]);

  const page = pageRows[0];
  const canvas = canvasRows[0];
  const organization = organizationRows[0];

  if (!organization) {
    return notFound();
  }

  if (canvas) {
    const content = await getJsonColumnFromTable(
      "initiative_canvas",
      "content",
      canvas.id
    );

    return (
      <div className="relative flex flex-1">
        <InitiativeCanvasDropdown
          canvasId={params.page}
          defaultTitle={canvas.title}
        />
        <InitiativeCanvasLoader
          defaultValue={content as unknown as CanvasState | undefined}
          editable={user.organizationRole !== PortalRole.Member}
          initiativeCanvasId={params.page}
        />
      </div>
    );
  }

  if (page) {
    const content = await getJsonColumnFromTable(
      "initiative_page",
      "content",
      page.id
    );

    return (
      <div className="relative">
        {/* <InitiativeSettingsDropdown initiativeId={params.initiative} /> */}
        <div className="w-full px-6 py-16">
          <div className="mx-auto grid w-full max-w-prose gap-6">
            <InitiativePageTitle
              defaultTitle={page.title}
              editable={user.organizationRole !== PortalRole.Member}
              pageId={params.page}
            />
            <InitiativePageEditor
              defaultValue={content as never}
              editable={user.organizationRole !== PortalRole.Member}
              pageId={params.page}
            />
          </div>
        </div>
      </div>
    );
  }

  return notFound();
};

export default Initiative;
