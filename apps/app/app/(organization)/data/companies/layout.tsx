import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@repo/design-system/components/ui/resizable";
import { eq, sql } from "drizzle-orm";
import { type ReactNode, Suspense } from "react";
import { FeedbackCompanyList } from "./components/feedback-company-list";

type CompaniesDataLayoutProperties = {
  readonly children: ReactNode;
};

const CompaniesDataLayoutContent = async ({
  children,
}: CompaniesDataLayoutProperties) => {
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return <div />;
  }

  const [countResult] = await Promise.all([
    database
      .select({ count: sql<number>`count(*)` })
      .from(tables.feedbackOrganization)
      .where(eq(tables.feedbackOrganization.organizationId, organizationId)),
  ]);

  const count = countResult?.[0]?.count ?? 0;

  if (count === 0) {
    return <div />;
  }

  return (
    <ResizablePanelGroup
      className="min-w-0 flex-1"
      direction="horizontal"
      style={{ overflow: "unset" }}
    >
      <ResizablePanel
        className="sticky top-0 h-screen min-w-80"
        defaultSize={30}
        maxSize={35}
        minSize={25}
        style={{ overflow: "auto" }}
      >
        <div className="h-full border-r">
          <FeedbackCompanyList />
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        className="min-w-0"
        defaultSize={70}
        style={{ overflow: "unset" }}
      >
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

const CompaniesDataLayout = ({ children }: CompaniesDataLayoutProperties) => (
  <Suspense fallback={null}>
    <CompaniesDataLayoutContent>{children}</CompaniesDataLayoutContent>
  </Suspense>
);

export default CompaniesDataLayout;
