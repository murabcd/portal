"use client";

import { handleError } from "@repo/design-system/lib/handle-error";
import useSWRInfinite from "swr/infinite";
import type { GetActivityResponse } from "@/actions/activity/get";
import { InfiniteLoader } from "@/components/infinite-loader";
import { deserializeActivityPage, normalizeActivityPage } from "@/lib/activity";
import { fetcher, withSearchParameters } from "@/lib/fetcher";
import type { MemberInfo } from "@/lib/serialization";
import { ActivityDay } from "./activity-day";

type ActivityFeedProperties = {
  readonly initialPage?: GetActivityResponse;
  readonly members: MemberInfo[];
};

export const ActivityFeed = ({
  initialPage,
  members,
}: ActivityFeedProperties) => {
  const { data, isLoading, isValidating, setSize, size } =
    useSWRInfinite<GetActivityResponse>(
      (pageIndex) =>
        withSearchParameters(
          "/api/activity",
          new URLSearchParams({ page: String(pageIndex) })
        ),
      async (key: string) => deserializeActivityPage(await fetcher(key)),
      {
        fallbackData: initialPage ? [initialPage] : undefined,
        onError: handleError,
        revalidateFirstPage: false,
      }
    );
  const activityPages = data?.map(normalizeActivityPage);

  if (isLoading) {
    return null;
  }

  return (
    <>
      {activityPages?.map((activity) => (
        <ActivityDay
          data={activity}
          key={activity.date.toISOString()}
          members={members}
        />
      ))}
      <InfiniteLoader
        loading={isValidating}
        onView={async () => {
          await setSize(size + 1);
        }}
      />
    </>
  );
};
