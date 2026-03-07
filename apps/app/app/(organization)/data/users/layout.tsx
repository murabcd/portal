import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@repo/design-system/components/ui/resizable";
import { eq, sql } from "drizzle-orm";
import { type ReactNode, Suspense } from "react";
import { FeedbackUsersList } from "./components/feedback-user-list";

type UsersDataLayoutProperties = {
  readonly children: ReactNode;
};

const UsersDataLayoutContent = async ({
  children,
}: UsersDataLayoutProperties) => {
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return <div />;
  }
  const [countResult] = await Promise.all([
    database
      .select({ count: sql<number>`count(*)` })
      .from(tables.feedbackUser)
      .where(eq(tables.feedbackUser.organizationId, organizationId)),
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
          <FeedbackUsersList />
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

const UsersDataLayout = ({ children }: UsersDataLayoutProperties) => (
  <Suspense fallback={null}>
    <UsersDataLayoutContent>{children}</UsersDataLayoutContent>
  </Suspense>
);

export default UsersDataLayout;
