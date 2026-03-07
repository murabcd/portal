"use client";

import { LoadingCircle } from "@repo/design-system/components/loading-circle";
import { handleError } from "@repo/design-system/lib/handle-error";
import useSWRInfinite from "swr/infinite";
import type { GetActivityResponse } from "@/actions/activity/get";
import { InfiniteLoader } from "@/components/infinite-loader";
import { fetcher } from "@/lib/fetcher";
import type { MemberInfo } from "@/lib/serialization";
import { ActivityDay } from "./activity-day";

type ActivityFeedProperties = {
  readonly members: MemberInfo[];
};

const deserializeActivityPage = (
  data: Record<string, unknown>
): GetActivityResponse => {
  const deserializeCollection = <T extends { createdAt: string }>(
    collection: T[]
  ) =>
    collection.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    }));

  return {
    ...(data as GetActivityResponse),
    date: new Date(data.date as string),
    initiatives: deserializeCollection(
      data.initiatives as Array<
        GetActivityResponse["initiatives"][number] & { createdAt: string }
      >
    ) as GetActivityResponse["initiatives"],
    initiativeMembers: deserializeCollection(
      data.initiativeMembers as Array<
        GetActivityResponse["initiativeMembers"][number] & {
          createdAt: string;
        }
      >
    ) as GetActivityResponse["initiativeMembers"],
    initiativePages: deserializeCollection(
      data.initiativePages as Array<
        GetActivityResponse["initiativePages"][number] & { createdAt: string }
      >
    ) as GetActivityResponse["initiativePages"],
    initiativeCanvases: deserializeCollection(
      data.initiativeCanvases as Array<
        GetActivityResponse["initiativeCanvases"][number] & {
          createdAt: string;
        }
      >
    ) as GetActivityResponse["initiativeCanvases"],
    initiativeExternalLinks: deserializeCollection(
      data.initiativeExternalLinks as Array<
        GetActivityResponse["initiativeExternalLinks"][number] & {
          createdAt: string;
        }
      >
    ) as GetActivityResponse["initiativeExternalLinks"],
    feedback: deserializeCollection(
      data.feedback as Array<
        GetActivityResponse["feedback"][number] & { createdAt: string }
      >
    ) as GetActivityResponse["feedback"],
    products: deserializeCollection(
      data.products as Array<
        GetActivityResponse["products"][number] & { createdAt: string }
      >
    ) as GetActivityResponse["products"],
    groups: deserializeCollection(
      data.groups as Array<
        GetActivityResponse["groups"][number] & { createdAt: string }
      >
    ) as GetActivityResponse["groups"],
    features: deserializeCollection(
      data.features as Array<
        GetActivityResponse["features"][number] & { createdAt: string }
      >
    ) as GetActivityResponse["features"],
    changelog: deserializeCollection(
      data.changelog as Array<
        GetActivityResponse["changelog"][number] & { createdAt: string }
      >
    ) as GetActivityResponse["changelog"],
    apiKeys: deserializeCollection(
      data.apiKeys as Array<
        GetActivityResponse["apiKeys"][number] & { createdAt: string }
      >
    ) as GetActivityResponse["apiKeys"],
    feedbackFeatureLinks: deserializeCollection(
      data.feedbackFeatureLinks as Array<
        GetActivityResponse["feedbackFeatureLinks"][number] & {
          createdAt: string;
        }
      >
    ) as GetActivityResponse["feedbackFeatureLinks"],
    releases: deserializeCollection(
      data.releases as Array<
        GetActivityResponse["releases"][number] & { createdAt: string }
      >
    ) as GetActivityResponse["releases"],
    members: deserializeCollection(
      data.members as Array<
        GetActivityResponse["members"][number] & { createdAt: string }
      >
    ) as GetActivityResponse["members"],
  };
};

export const ActivityFeed = ({ members }: ActivityFeedProperties) => {
  const { data, isLoading, isValidating, setSize, size } =
    useSWRInfinite<GetActivityResponse>(
      (pageIndex) => `/api/activity?page=${pageIndex}`,
      async (key: string) => deserializeActivityPage(await fetcher(key)),
      { onError: handleError, revalidateFirstPage: false }
    );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <LoadingCircle />
      </div>
    );
  }

  return (
    <>
      {data?.map((activity) => (
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
