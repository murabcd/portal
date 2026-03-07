import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import type { JSONContent } from "@repo/editor";
import { contentToText, textToContent } from "@repo/editor/lib/tiptap";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/metadata";
import { TemplateEditor } from "./components/template-editor";
import { TemplateTitle } from "./components/template-title";

type TemplatePageProperties = {
  readonly params: Promise<{
    readonly templateId: string;
  }>;
};

export const dynamic = "force-dynamic";

export const generateMetadata = async (
  props: TemplatePageProperties
): Promise<Metadata> => {
  const params = await props.params;
  const template = await database
    .select({
      title: tables.template.title,
      id: tables.template.id,
    })
    .from(tables.template)
    .where(eq(tables.template.id, params.templateId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!template) {
    return {};
  }

  const content = await getJsonColumnFromTable(
    "template",
    "content",
    template.id
  );
  const text = content ? contentToText(content) : "";

  return createMetadata({
    title: template.title,
    description: text.slice(0, 150),
  });
};

const TemplatePage = async (props: TemplatePageProperties) => {
  const params = await props.params;
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    notFound();
  }

  const template = await database
    .select({
      title: tables.template.title,
      id: tables.template.id,
    })
    .from(tables.template)
    .where(eq(tables.template.id, params.templateId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!template) {
    notFound();
  }

  let content = await getJsonColumnFromTable(
    "template",
    "content",
    template.id
  );

  if (!content) {
    const newContent = textToContent("") as JsonValue;

    await database
      .update(tables.template)
      .set({ content: newContent, updatedAt: new Date().toISOString() })
      .where(eq(tables.template.id, params.templateId));

    content = newContent;
  }

  return (
    <>
      <TemplateTitle
        defaultTitle={template.title}
        editable={user.organizationRole !== PortalRole.Member}
        templateId={params.templateId}
      />
      <TemplateEditor
        defaultValue={content as JSONContent}
        editable={user.organizationRole !== PortalRole.Member}
        templateId={params.templateId}
      />
    </>
  );
};

export default TemplatePage;
