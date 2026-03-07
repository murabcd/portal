"use client";

import { Avatar } from "@repo/design-system/components/precomposed/avatar";
import { handleError } from "@repo/design-system/lib/handle-error";
import { formatDate } from "@repo/lib/format";
import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import type {
  FeedbackCursor,
  GetFeedbackResponse,
} from "@/actions/feedback/get";
import { getFeedback } from "@/actions/feedback/get";
import { ItemList } from "@/components/item-list";
import { useFeedbackOptions } from "@/hooks/use-feedback-options";

export const FeedbackList = () => {
  type FeedbackPage = {
    data: GetFeedbackResponse;
    nextCursor: FeedbackCursor | null;
  };

  const { showProcessed } = useFeedbackOptions();
  const { data, fetchNextPage, isFetching, hasNextPage } = useInfiniteQuery<
    FeedbackPage,
    Error,
    InfiniteData<FeedbackPage>,
    (string | boolean)[],
    FeedbackCursor | null
  >({
    queryKey: ["feedback", showProcessed],
    queryFn: async ({ pageParam }): Promise<FeedbackPage> => {
      try {
        const response = await getFeedback(showProcessed, pageParam);

        if ("error" in response) {
          throw response.error;
        }

        return response;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    initialPageParam: null as FeedbackCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  return (
    <ItemList
      data={
        data?.pages.flatMap((page) =>
          page.data.map((item) => ({
            id: item.id,
            href: `/feedback/${item.id}`,
            title: item.title,
            description: item.text,
            caption: formatDate(new Date(item.createdAt)),
            image: item.feedbackUser?.imageUrl ? (
              <Avatar
                fallback={item.feedbackUser.name.slice(0, 2)}
                src={item.feedbackUser.imageUrl ?? undefined}
              />
            ) : null,
          }))
        ) ?? []
      }
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetching={isFetching}
    />
  );
};
