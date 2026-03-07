import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import {
  database,
  getJsonColumnFromTable,
  tables,
} from "@repo/backend/database";
import type { JSONContent } from "@repo/editor";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FeatureEditor } from "./components/feature-editor";
import { FeatureTemplateSelector } from "./components/feature-template-selector";
import { FeatureTitle } from "./components/feature-title";
import type { TemplateProperties } from "./components/template";

type FeaturePageProperties = {
  readonly params: Promise<{
    readonly feature: string;
  }>;
};

const FeaturePageContent = async (props: FeaturePageProperties) => {
  const params = await props.params;
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    notFound();
  }

  const [feature, templates, organization] = await Promise.all([
    database
      .select({ id: tables.feature.id, title: tables.feature.title })
      .from(tables.feature)
      .where(eq(tables.feature.id, params.feature))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    database
      .select({
        id: tables.template.id,
        title: tables.template.title,
        description: tables.template.description,
      })
      .from(tables.template),
    database
      .select({ id: tables.organization.id })
      .from(tables.organization)
      .where(eq(tables.organization.id, organizationId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  if (!(feature && organization)) {
    notFound();
  }

  const content = await getJsonColumnFromTable(
    "feature",
    "content",
    feature.id
  );

  const templatePromises = templates.map(async (template) => {
    const templateContent = await getJsonColumnFromTable(
      "template",
      "content",
      template.id
    );

    const newTemplate: TemplateProperties = {
      id: template.id,
      title: template.title,
      description: template.description,
      content: templateContent,
    };

    return newTemplate;
  });

  const modifiedTemplates = await Promise.all(templatePromises);

  return (
    <div className="w-full px-6 py-16">
      <div className="mx-auto grid w-full max-w-prose gap-6">
        <FeatureTitle
          defaultTitle={feature.title}
          editable={user.organizationRole !== PortalRole.Member}
          featureId={params.feature}
        />
        {content ? (
          <FeatureEditor
            defaultValue={content as JSONContent}
            editable={user.organizationRole !== PortalRole.Member}
            featureId={params.feature}
          />
        ) : (
          <FeatureTemplateSelector
            featureId={params.feature}
            templates={modifiedTemplates}
          />
        )}
      </div>
    </div>
  );
};

const FeaturePage = (props: FeaturePageProperties) => (
  <Suspense fallback={null}>
    <FeaturePageContent {...props} />
  </Suspense>
);

export default FeaturePage;
