"use client";

import { LoadingCircle } from "@repo/design-system/components/loading-circle";
import { Avatar } from "@repo/design-system/components/precomposed/avatar";
import { handleError } from "@repo/design-system/lib/handle-error";
import { formatDate } from "@repo/lib/format";
import useSWRInfinite from "swr/infinite";
import { ItemList } from "@/components/item-list";
import { fetcher } from "@/lib/fetcher";

type FeedbackUserCursor = {
  readonly name: string;
  readonly id: string;
};

type FeedbackUserItem = {
  readonly createdAt: string;
  readonly email: string;
  readonly id: string;
  readonly imageUrl: string | null;
  readonly name: string;
};

type FeedbackUsersPage = {
  readonly data: FeedbackUserItem[];
  readonly nextCursor: FeedbackUserCursor | null;
};

export const FeedbackUsersList = () => {
  const { data, isLoading, isValidating, setSize, size } =
    useSWRInfinite<FeedbackUsersPage>(
      (pageIndex, previousPageData) => {
        if (previousPageData && !previousPageData.nextCursor) {
          return null;
        }

        const searchParameters = new URLSearchParams();

        if (pageIndex > 0 && previousPageData?.nextCursor) {
          searchParameters.set("cursorName", previousPageData.nextCursor.name);
          searchParameters.set("cursorId", previousPageData.nextCursor.id);
        }

        return `/api/data/users?${searchParameters.toString()}`;
      },
      fetcher,
      { onError: handleError, revalidateFirstPage: false }
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
