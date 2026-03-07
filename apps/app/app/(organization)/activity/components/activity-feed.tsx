"use client";

import { handleError } from "@repo/design-system/lib/handle-error";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getActivity } from "@/actions/activity/get";
import { InfiniteLoader } from "@/components/infinite-loader";
import type { MemberInfo } from "@/lib/serialization";
import { ActivityDay } from "./activity-day";

type ActivityFeedProperties = {
  readonly members: MemberInfo[];
};

export const ActivityFeed = ({ members }: ActivityFeedProperties) => {
  const { data, fetchNextPage, isFetching, hasNextPage } = useInfiniteQuery({
    queryKey: ["activity"],
    queryFn: async ({ pageParam }) => {
      try {
        const response = await getActivity(pageParam);

        if ("error" in response) {
          throw response.error;
        }

        return response.data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    initialPageParam: 0,
    getNextPageParam: (_lastPage, _allPages, lastPageParameter) =>
      lastPageParameter + 1,
    getPreviousPageParam: (_firstPage, _allPages, firstPageParameter) =>
      firstPageParameter <= 1 ? undefined : firstPageParameter - 1,
  });

  return (
    <>
      {data?.pages.map((activity) => (
        <ActivityDay
          data={activity}
          key={activity.date.toISOString()}
          members={members}
        />
      ))}
      {hasNextPage ? (
        <InfiniteLoader loading={isFetching} onView={fetchNextPage} />
      ) : null}
    </>
  );
};
