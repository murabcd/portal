"use client";

import { handleError } from "@repo/design-system/lib/handle-error";
import { formatDate } from "@repo/lib/format";
import useSWRInfinite from "swr/infinite";
import { CompanyLogo } from "@/app/(organization)/components/company-logo";
import { ItemList } from "@/components/item-list";
import { fetcher, withSearchParameters } from "@/lib/fetcher";

type FeedbackOrganizationCursor = {
  readonly name: string;
  readonly id: string;
};

type FeedbackCompanyItem = {
  readonly createdAt: string;
  readonly domain: string | null;
  readonly id: string;
  readonly name: string;
};

type FeedbackCompaniesPage = {
  readonly data: FeedbackCompanyItem[];
  readonly nextCursor: FeedbackOrganizationCursor | null;
};

export const FeedbackCompanyList = () => {
  const { data, isLoading, isValidating, setSize, size } =
    useSWRInfinite<FeedbackCompaniesPage>(
      (pageIndex, previousPageData) => {
        if (previousPageData && !previousPageData.nextCursor) {
          return null;
        }

        const searchParameters = new URLSearchParams();

        if (pageIndex > 0 && previousPageData?.nextCursor) {
          searchParameters.set("cursorName", previousPageData.nextCursor.name);
          searchParameters.set("cursorId", previousPageData.nextCursor.id);
        }

        return withSearchParameters("/api/data/companies", searchParameters);
      },
      fetcher,
      { onError: handleError, revalidateFirstPage: false }
    );

  const pages = data ?? [];
  const lastPage = pages.at(-1);
  const hasNextPage = Boolean(lastPage?.nextCursor);

  if (isLoading) {
    return null;
  }

  return (
    <ItemList
      data={pages.flatMap((page) =>
        page.data.map((item) => ({
          id: item.id,
          href: `/data/companies/${item.id}`,
          title: item.name,
          description: item.domain ?? "",
          caption: formatDate(new Date(item.createdAt)),
          image: (
            <CompanyLogo
              fallback={item.name.slice(0, 2)}
              size={20}
              src={item.domain}
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
