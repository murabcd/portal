import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/design-system/components/ui/sheet";
import { createMetadata } from "@repo/lib/metadata";
import { eq } from "drizzle-orm";
import { BookIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { APIDocumentation } from "./components/api-documentation";
import { ApiKeysTable } from "./components/api-keys-table";

export const metadata: Metadata = createMetadata({
  title: "API Keys",
  description: "Manage your API keys",
});

const APIPage = async () => {
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    notFound();
  }

  const [organization] = await database
    .select({ id: tables.organization.id })
    .from(tables.organization)
    .where(eq(tables.organization.id, organizationId))
    .limit(1);

  if (!organization) {
    notFound();
  }

  return (
    <div className="px-6 py-16">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="m-0 font-semibold text-4xl tracking-tight">API</h1>
            <p className="mb-0 text-muted-foreground">Manage your API keys.</p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button className="flex items-center gap-2" variant="outline">
                <BookIcon className="text-muted-foreground" size={16} />
                <span>API documentation</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Portal API</SheetTitle>
                <SheetDescription asChild>
                  <div>
                    <APIDocumentation />
                  </div>
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
        <Suspense fallback={null}>
          <ApiKeysTable />
        </Suspense>
      </div>
    </div>
  );
};

export default APIPage;
