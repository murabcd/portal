import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@repo/design-system/components/ui/resizable";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { eq, sql } from "drizzle-orm";
import type { ReactNode } from "react";
import type { FeedbackOrganizationCursor } from "@/actions/feedback-organization/list";
import { getFeedbackCompanies } from "@/actions/feedback-organization/list";
import { FeedbackCompanyList } from "./components/feedback-company-list";

type CompaniesDataLayoutProperties = {
  readonly children: ReactNode;
};

const CompaniesDataLayout = async ({
  children,
}: CompaniesDataLayoutProperties) => {
  const queryClient = new QueryClient();
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return <div />;
  }

  const [countResult] = await Promise.all([
    database
      .select({ count: sql<number>`count(*)` })
      .from(tables.feedbackOrganization)
      .where(eq(tables.feedbackOrganization.organizationId, organizationId)),
    queryClient.prefetchInfiniteQuery({
      queryKey: ["feedbackCompanies"],
      queryFn: async ({ pageParam }) => {
        const response = await getFeedbackCompanies(pageParam);

        if ("error" in response) {
          throw response.error;
        }

        return response;
      },
      initialPageParam: null as FeedbackOrganizationCursor | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      pages: 1,
    }),
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
          <HydrationBoundary state={dehydrate(queryClient)}>
            <FeedbackCompanyList />
          </HydrationBoundary>
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

export default CompaniesDataLayout;
