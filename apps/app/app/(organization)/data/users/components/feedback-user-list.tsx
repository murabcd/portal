"use client";

import { Avatar } from "@repo/design-system/components/precomposed/avatar";
import { handleError } from "@repo/design-system/lib/handle-error";
import { formatDate } from "@repo/lib/format";
import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import type {
  FeedbackUserCursor,
  GetFeedbackUsersResponse,
} from "@/actions/feedback-user/list";
import { getFeedbackUsers } from "@/actions/feedback-user/list";
import { ItemList } from "@/components/item-list";

export const FeedbackUsersList = () => {
  type FeedbackUsersPage = {
    data: GetFeedbackUsersResponse;
    nextCursor: FeedbackUserCursor | null;
  };

  const { data, fetchNextPage, isFetching, hasNextPage } = useInfiniteQuery<
    FeedbackUsersPage,
    Error,
    InfiniteData<FeedbackUsersPage>,
    string[],
    FeedbackUserCursor | null
  >({
    queryKey: ["feedbackUsers"],
    queryFn: async ({ pageParam }): Promise<FeedbackUsersPage> => {
      try {
        const response = await getFeedbackUsers(pageParam);

        if ("error" in response) {
          throw response.error;
        }

        return response;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    initialPageParam: null as FeedbackUserCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  return (
    <ItemList
      data={
        data?.pages.flatMap((page) =>
          page.data.map((item) => ({
            id: item.id,
            href: `/data/users/${item.id}`,
            title: item.name,
            description: item.email,
            caption: formatDate(new Date(item.createdAt)),
            image: (
              <Avatar
                fallback={item.name.slice(0, 2)}
                src={item.imageUrl ?? undefined}
              />
            ),
          }))
        ) ?? []
      }
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetching={isFetching}
    />
  );
};
