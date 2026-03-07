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
import type { FeedbackCursor } from "@/actions/feedback/get";
import { getFeedback } from "@/actions/feedback/get";
import { Header } from "@/components/header";
import { CreateFeedbackButton } from "./components/create-feedback-button";
import { FeedbackEmptyState } from "./components/feedback-empty-state";
import { FeedbackList } from "./components/feedback-list";
import { ToggleProcessedButton } from "./components/toggle-processed-button";

type FeedbackLayoutProperties = {
  readonly children: ReactNode;
};

const FeedbackLayout = async ({ children }: FeedbackLayoutProperties) => {
  const queryClient = new QueryClient();
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return <div />;
  }
  const [countResult] = await Promise.all([
    database
      .select({ count: sql<number>`count(*)` })
      .from(tables.feedback)
      .where(eq(tables.feedback.organizationId, organizationId)),
    queryClient.prefetchInfiniteQuery({
      queryKey: ["feedback", false],
      queryFn: async ({ pageParam }) => {
        const response = await getFeedback(false, pageParam);

        if ("error" in response) {
          throw response.error;
        }

        return response;
      },
      initialPageParam: null as FeedbackCursor | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      pages: 1,
    }),
  ]);

  const count = countResult?.[0]?.count ?? 0;

  if (count === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <FeedbackEmptyState />
      </div>
    );
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
          <Header badge={count} title="Feedback">
            <div className="-m-2 flex items-center gap-px">
              <ToggleProcessedButton />
              <CreateFeedbackButton />
            </div>
          </Header>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <FeedbackList />
          </HydrationBoundary>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        className="flex min-h-screen min-w-0 flex-col self-start"
        defaultSize={70}
        style={{ overflow: "unset" }}
      >
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default FeedbackLayout;
