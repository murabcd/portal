import { database, tables } from "@repo/backend/database";
import type { Metadata } from "next";
import { Suspense } from "react";
import { createMetadata } from "@/lib/metadata";
import { CreateTemplateButton } from "./components/create-template-button";
import { TemplateComponent } from "./components/template";

const title = "Templates";
const description = "Manage templates for your organization.";

export const metadata: Metadata = createMetadata({
  title,
  description,
});

const Templates = async () => {
  const templates = await database
    .select({ id: tables.template.id })
    .from(tables.template);

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="m-0 font-semibold text-4xl tracking-tight">{title}</h1>
          <p className="mb-0 text-muted-foreground">{description}</p>
        </div>
        <CreateTemplateButton />
      </div>
      <div className="grid grid-cols-3 gap-8">
        {templates.map((template) => (
          <Suspense fallback={null} key={template.id}>
            <TemplateComponent id={template.id} />
          </Suspense>
        ))}
      </div>
    </div>
  );
};

export default Templates;
