"use client";
import { toast } from "@repo/design-system/lib/toast";
import { cn } from "@repo/design-system/lib/utils";
import { formatDate } from "@repo/lib/format";
import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { GetChangelogResponse } from "@/actions/changelog/get";
import { getChangelog } from "@/actions/changelog/get";
import { ItemList } from "@/components/item-list";

export const ChangelogList = () => {
  type ChangelogCursor = { publishAt: string; id: string };
  type ChangelogPage = {
    data: GetChangelogResponse;
    nextCursor: ChangelogCursor | null;
  };

  const { data, fetchNextPage, isFetching, hasNextPage } = useInfiniteQuery<
    ChangelogPage,
    Error,
    InfiniteData<ChangelogPage>,
    string[],
    ChangelogCursor | null
  >({
    queryKey: ["changelog"],
    queryFn: async ({ pageParam }): Promise<ChangelogPage> => {
      try {
        const response = await getChangelog(pageParam);

        if ("error" in response) {
          throw response.error;
        }

        return response;
      } catch (error) {
        const normalizedError =
          error instanceof Error
            ? error
            : new Error("Failed to load changelog.");

        toast.error(normalizedError.message);
        throw normalizedError;
      }
    },
    initialPageParam: null as ChangelogCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  return (
    <ItemList
      data={
        data?.pages.flatMap((page) =>
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
        ) ?? []
      }
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetching={isFetching}
    />
  );
};
