"use client";
import { LoadingCircle } from "@repo/design-system/components/loading-circle";
import { toast } from "@repo/design-system/lib/toast";
import { cn } from "@repo/design-system/lib/utils";
import { formatDate } from "@repo/lib/format";
import useSWRInfinite from "swr/infinite";
import { ItemList } from "@/components/item-list";
import { fetcher } from "@/lib/fetcher";

type GetChangelogResponse = {
  id: string;
  publishAt: string;
  status: "DRAFT" | "PUBLISHED";
  text: string;
  title: string;
}[];

export const ChangelogList = () => {
  type ChangelogCursor = { publishAt: string; id: string };
  type ChangelogPage = {
    data: GetChangelogResponse;
    nextCursor: ChangelogCursor | null;
  };

  const { data, isLoading, isValidating, setSize, size } =
    useSWRInfinite<ChangelogPage>(
      (pageIndex, previousPageData) => {
        if (previousPageData && !previousPageData.nextCursor) {
          return null;
        }

        const searchParameters = new URLSearchParams();

        if (pageIndex > 0 && previousPageData?.nextCursor) {
          searchParameters.set(
            "cursorPublishAt",
            previousPageData.nextCursor.publishAt
          );
          searchParameters.set("cursorId", previousPageData.nextCursor.id);
        }

        return `/api/changelog?${searchParameters.toString()}`;
      },
      fetcher,
      {
        onError: (error) => {
          const normalizedError =
            error instanceof Error
              ? error
              : new Error("Failed to load changelog.");

          toast.error(normalizedError.message);
        },
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
          href: `/changelog/${item.id}`,
          title: (
            <span className="flex items-center gap-2">
              <span>{item.title}</span>
              <span
                className={cn(
                  "aspect-square w-1.5 shrink-0 rounded-full",
                  item.status === "PUBLISHED" ? "bg-success" : "bg-card"
                )}
              />
            </span>
          ),
          description: item.text,
          caption: formatDate(new Date(item.publishAt)),
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
