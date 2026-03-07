"use client";

import { LoadingCircle } from "@repo/design-system/components/loading-circle";
import { Avatar } from "@repo/design-system/components/precomposed/avatar";
import { handleError } from "@repo/design-system/lib/handle-error";
import { formatDate } from "@repo/lib/format";
import useSWRInfinite from "swr/infinite";
import { ItemList } from "@/components/item-list";
import { useFeedbackOptions } from "@/hooks/use-feedback-options";
import { fetcher } from "@/lib/fetcher";

type FeedbackCursor = {
  readonly createdAt: string;
  readonly id: string;
};

type FeedbackItem = {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly text: string;
  readonly feedbackUser: {
    readonly email: string;
    readonly imageUrl: string;
    readonly name: string;
  } | null;
};

type FeedbackPage = {
  readonly data: FeedbackItem[];
  readonly nextCursor: FeedbackCursor | null;
  readonly totalCount: number;
};

export const FeedbackList = () => {
  const { showProcessed } = useFeedbackOptions();
  const { data, isLoading, isValidating, setSize, size } =
    useSWRInfinite<FeedbackPage>(
      (pageIndex, previousPageData) => {
        if (previousPageData && !previousPageData.nextCursor) {
          return null;
        }

        const searchParameters = new URLSearchParams({
          showProcessed: String(showProcessed),
        });

        if (pageIndex > 0 && previousPageData?.nextCursor) {
          searchParameters.set(
            "cursorCreatedAt",
            previousPageData.nextCursor.createdAt
          );
          searchParameters.set("cursorId", previousPageData.nextCursor.id);
        }

        return `/api/feedback?${searchParameters.toString()}`;
      },
      fetcher,
      {
        onError: handleError,
        persistSize: false,
        revalidateFirstPage: false,
      }
    );

  const pages = data ?? [];
  const lastPage = pages.at(-1);
  const hasNextPage = Boolean(lastPage?.nextCursor);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <LoadingCircle />
      </div>
    );
  }

  return (
    <ItemList
      data={pages.flatMap((page) =>
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
      )}
      fetchNextPage={async () => {
        if (!hasNextPage) {
          return;
        }

        await setSize(size + 1);
      }}
      hasNextPage={hasNextPage}
      isFetching={isValidating}
    />
  );
};
