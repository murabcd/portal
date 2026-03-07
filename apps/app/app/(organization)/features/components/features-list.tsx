"use client";

import { PortalRole } from "@repo/backend/auth";
import { getUserName } from "@repo/backend/auth/format";
import type {
  FeatureStatus,
  Group,
  Product,
  Release,
} from "@repo/backend/types";
import { DataTableColumnHeader } from "@repo/design-system/components/data-table-column-header";
import { Link } from "@repo/design-system/components/link";
import { Checkbox } from "@repo/design-system/components/precomposed/checkbox";
import { Input } from "@repo/design-system/components/precomposed/input";
import { Tooltip } from "@repo/design-system/components/precomposed/tooltip";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { handleError } from "@repo/design-system/lib/handle-error";
import type {
  ColumnDef,
  ColumnFiltersState,
  Table as DataTable,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  FilterIcon,
  LinkIcon,
  SparkleIcon,
  UserCircleIcon,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import type { ComponentProps, FormEventHandler } from "react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";
import type {
  FeatureCursor,
  FeatureFilters,
  GetFeaturesResponse,
} from "@/actions/feature/list";
import { AvatarTooltip } from "@/components/avatar-tooltip";
import { EmptyState } from "@/components/empty-state";
import { useFeatureForm } from "@/components/feature-form/use-feature-form";
import { Header } from "@/components/header";
import { fetcher, withSearchParameters } from "@/lib/fetcher";
import { calculateRice } from "@/lib/rice";
import type { MemberInfo } from "@/lib/serialization";
import { FeatureRiceScore } from "../[feature]/components/feature-rice-score";
import { FeaturesListFilter } from "./features-list-filter";
import { FeaturesToolbar } from "./features-toolbar";

type FeaturesListProperties = {
  readonly title?: string;
  readonly editable?: boolean;
  readonly breadcrumbs?: ComponentProps<typeof Header>["breadcrumbs"];
  readonly statuses: Pick<FeatureStatus, "color" | "id" | "name" | "order">[];
  readonly query: FeatureFilters;
  readonly count: number;
  readonly products: Pick<Product, "emoji" | "id" | "name">[];
  readonly releases: Pick<Release, "id" | "title">[];
  readonly groups: Pick<
    Group,
    "emoji" | "id" | "name" | "parentGroupId" | "productId"
  >[];
  readonly members: MemberInfo[];
  readonly role?: string;
};

type FeaturesPage = {
  data: GetFeaturesResponse;
  nextCursor: FeatureCursor | null;
  total: number;
};

type FeatureFilterOption = {
  label: string;
  value: string;
  color: string;
};

const getInitialColumnFilters = (): ColumnFiltersState => {
  if (typeof window === "undefined") {
    return [];
  }

  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get("id");
  const value = searchParams.get("value");

  if (!(id && value)) {
    return [];
  }

  return [{ id, value: JSON.parse(value) }];
};

const createColumns = (
  members: MemberInfo[],
  editable: boolean
): ColumnDef<GetFeaturesResponse[number]>[] => [
  {
    id: "select",
    enableSorting: false,
    header: ({ table }) =>
      editable ? (
        <Checkbox
          aria-label="Select all"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(Boolean(value))
          }
        />
      ) : null,
    cell: ({ row }) =>
      editable ? (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
        />
      ) : null,
  },
  {
    accessorKey: "title",
    sortingFn: (rowA, rowB) =>
      rowA.original.title.localeCompare(rowB.original.title, undefined, {
        sensitivity: "base",
      }),
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const breadcrumbs: string[] = [];

      if (row.original.product) {
        breadcrumbs.push(row.original.product.name);
      }

      if (row.original.group?.parentGroupId) {
        breadcrumbs.push("...");
      }

      if (row.original.group) {
        breadcrumbs.push(row.original.group.name);
      }

      return (
        <Link
          className="block max-w-[300px] overflow-hidden"
          href={`/features/${row.original.id}`}
        >
          <span className="block truncate">{row.original.title}</span>
          <span className="block truncate text-muted-foreground text-xs">
            {breadcrumbs.join(" / ")}
          </span>
        </Link>
      );
    },
  },
  {
    id: "status",
    accessorKey: "status",
    sortingFn: (rowA, rowB) =>
      (rowA.original.status?.order ?? 0) - (rowB.original.status?.order ?? 0),
    filterFn: (row, _id, value: string[]) =>
      row.original.status ? value.includes(row.original.status.id) : false,
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) =>
      row.original.status ? (
        <div className="h-2 w-2">
          <Tooltip content={row.original.status.name}>
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: row.original.status.color }}
            />
          </Tooltip>
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">None</span>
      ),
  },
  {
    id: "owner",
    accessorKey: "ownerId",
    sortingFn: (rowA, rowB) => {
      const memberA = members.find(
        (member) => member.id === rowA.original.ownerId
      );
      const memberB = members.find(
        (member) => member.id === rowB.original.ownerId
      );

      const memberAName = memberA ? getUserName(memberA) : "";
      const memberBName = memberB ? getUserName(memberB) : "";

      if (!(memberAName || memberBName)) {
        return 0;
      }

      if (!memberAName) {
        return 1;
      }

      if (!memberBName) {
        return -1;
      }

      return memberAName.localeCompare(memberBName, undefined, {
        sensitivity: "base",
      });
    },
    filterFn: (row, _id, value: string[]) =>
      value.includes(row.original.ownerId),
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Owner" />
    ),
    cell: ({ row }) => {
      const member = members.find(({ id }) => id === row.original.ownerId);
      const name = member ? getUserName(member) : "";

      if (!(member && name)) {
        return <p className="text-muted-foreground">None</p>;
      }

      return (
        <AvatarTooltip
          fallback={name.slice(0, 2).toUpperCase()}
          src={member.image ?? undefined}
          subtitle={member.id}
          title={name}
        />
      );
    },
  },
  {
    accessorFn: (row) => row.rice ?? row.aiRice,
    id: "rice",
    sortingFn: (rowA, rowB) => {
      const riceA = rowA.original.rice ?? rowA.original.aiRice;
      const riceB = rowB.original.rice ?? rowB.original.aiRice;

      const calculatedRiceA = riceA ? calculateRice(riceA) : 0;
      const calculatedRiceB = riceB ? calculateRice(riceB) : 0;

      return calculatedRiceA - calculatedRiceB;
    },
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="RICE" />
    ),
    cell: ({ row }) => {
      const aiRice = row.original.aiRice;
      const showAiRice = Boolean(aiRice) && !row.original.rice;

      return (
        <>
          {row.original.rice ? (
            <FeatureRiceScore rice={row.original.rice} />
          ) : null}
          {showAiRice ? (
            <div className="flex items-center gap-2 text-violet-500 dark:text-violet-400">
              <SparkleIcon size={16} />
              {aiRice ? <FeatureRiceScore rice={aiRice} /> : null}
            </div>
          ) : null}
          {row.original.rice || row.original.aiRice ? null : (
            <p className="text-muted-foreground">None</p>
          )}
        </>
      );
    },
  },
  {
    id: "feedback",
    accessorKey: "_count.feedback",
    sortingFn: (rowA, rowB) =>
      rowA.original._count.feedback - rowB.original._count.feedback,
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Feedback" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <LinkIcon className="text-muted-foreground" size={16} />
        {row.original._count.feedback}
      </div>
    ),
  },
  {
    id: "connection",
    accessorKey: "connection.href",
    sortingFn: (rowA, rowB) => {
      const portalA = rowA.original.connection?.href ?? "";
      const portalB = rowB.original.connection?.href ?? "";

      return portalA.localeCompare(portalB, undefined, { sensitivity: "base" });
    },
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Link" />
    ),
    cell: ({ row }) => {
      const featureConnectionSource = "/jira.svg";

      return row.original.connection ? (
        <Button asChild size="icon" variant="link">
          <a
            aria-label="Connection"
            href={row.original.connection.href}
            rel="noreferrer"
            target="_blank"
          >
            <Image
              alt=""
              height={16}
              src={featureConnectionSource}
              width={16}
            />
          </a>
        </Button>
      ) : null;
    },
  },
  {
    accessorKey: "createdAt",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <p className="whitespace-nowrap text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </p>
    ),
  },
];

type FeaturesHeaderActionsProperties = {
  readonly handleSearch: FormEventHandler<HTMLFormElement>;
  readonly handleShow: () => void;
  readonly members: MemberInfo[];
  readonly role?: string;
  readonly statusOptions: FeatureFilterOption[];
  readonly table: DataTable<GetFeaturesResponse[number]>;
};

const FeaturesHeaderActions = ({
  handleSearch,
  handleShow,
  members,
  role,
  statusOptions,
  table,
}: FeaturesHeaderActionsProperties) => (
  <div className="-m-2 flex flex-1 items-center justify-end gap-2">
    <FeaturesListFilter
      column={table.getColumn("status")}
      icon={FilterIcon}
      options={statusOptions}
      renderItem={(item) => {
        const source = statusOptions.find(
          (status) => status.value === item.value
        );

        if (!source) {
          return null;
        }

        return (
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: source.color }}
            />
            {item.label}
          </div>
        );
      }}
      title="Status"
    />
    <FeaturesListFilter
      column={table.getColumn("owner")}
      icon={UserCircleIcon}
      options={members.map((member) => ({
        label: getUserName(member),
        value: member.id ?? "",
        color: "",
      }))}
      renderItem={(item) => {
        const member = members.find(({ id }) => id === item.value);

        if (!member) {
          return null;
        }

        return (
          <div className="flex items-center gap-2">
            {member.image ? (
              <Image
                alt=""
                className="h-5 w-5 rounded-full object-cover"
                height={20}
                src={member.image}
                width={20}
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-muted" />
            )}
            {item.label}
          </div>
        );
      }}
      title="Owner"
    />
    <form onSubmit={handleSearch}>
      <Input
        className="h-8 w-48 bg-background text-xs"
        name="search"
        placeholder="Search"
      />
    </form>
    {role === PortalRole.Member ? null : (
      <Button className="shrink-0" onClick={handleShow} size="sm">
        Create
      </Button>
    )}
  </div>
);

type FeaturesTableProperties = {
  readonly table: DataTable<GetFeaturesResponse[number]>;
};

const FeaturesTable = ({ table }: FeaturesTableProperties) => {
  const rows = table.getRowModel().rows;

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-backdrop/90 backdrop-blur-sm">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        {rows.length > 0 ? (
          <TableBody>
            {rows.map((row) => (
              <TableRow
                className="h-[53px]"
                data-state={row.getIsSelected() && "selected"}
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        ) : null}
      </Table>
      {rows.length === 0 ? (
        <div className="flex flex-1 border-t">
          <EmptyState
            className="h-full min-h-0 flex-1"
            compact
            description="Try adjusting your filters or search query."
            title="No features found."
          />
        </div>
      ) : null}
    </div>
  );
};

const FeaturesListContent = ({
  title = "Features",
  breadcrumbs,
  statuses,
  query,
  count,
  products,
  groups,
  releases,
  editable = false,
  members,
  role,
}: FeaturesListProperties) => {
  const router = useRouter();
  const { show } = useFeatureForm();
  const parameters = useParams();
  const { data, isLoading, isValidating, setSize, size } =
    useSWRInfinite<FeaturesPage>(
      (pageIndex, previousPageData) => {
        if (previousPageData && !previousPageData.nextCursor) {
          return null;
        }

        const searchParameters = new URLSearchParams();

        if (query.search) {
          searchParameters.set("search", query.search);
        }
        if (query.productId) {
          searchParameters.set("productId", query.productId);
        }
        if (query.groupId) {
          searchParameters.set("groupId", query.groupId);
        }
        if (query.statusId) {
          searchParameters.set("statusId", query.statusId);
        }
        if (pageIndex > 0 && previousPageData?.nextCursor) {
          searchParameters.set(
            "cursorCreatedAt",
            previousPageData.nextCursor.createdAt
          );
          searchParameters.set("cursorId", previousPageData.nextCursor.id);
        }

        return withSearchParameters("/api/features", searchParameters);
      },
      fetcher,
      {
        onError: handleError,
        persistSize: true,
        revalidateFirstPage: false,
      }
    );
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() =>
    getInitialColumnFilters()
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const flatData = useMemo(
    () => data?.flatMap((page) => page.data) ?? [],
    [data]
  );
  const totalDbRowCount = data?.at(0)?.total ?? 0;
  const totalFetched = flatData.length;
  const columns = useMemo(
    () => createColumns(members, editable),
    [members, editable]
  );

  const table = useReactTable({
    data: flatData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original.id);

  const fetchMoreOnBottomReached = useCallback(() => {
    const { scrollY, innerHeight } = window;
    const { scrollHeight } = document.documentElement;

    // Once the user has scrolled within 200px of the bottom of the page, fetch more data if we can
    if (
      scrollHeight - scrollY - innerHeight < 200 &&
      !isValidating &&
      totalFetched < totalDbRowCount
    ) {
      setSize(size + 1).catch(handleError);
    }
  }, [isValidating, setSize, size, totalFetched, totalDbRowCount]);

  useEffect(() => {
    window.addEventListener("scroll", fetchMoreOnBottomReached, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", fetchMoreOnBottomReached);
    };
  }, [fetchMoreOnBottomReached]);

  const handleShow = () => {
    const groupId =
      typeof parameters.group === "string" ? parameters.group : undefined;
    let productId =
      typeof parameters.product === "string" ? parameters.product : undefined;

    if (parameters.group) {
      productId =
        groups.find(({ id }) => id === parameters.group)?.productId ??
        undefined;
    }

    show({ groupId, productId });
  };

  const uniqueStatuses: FeatureFilterOption[] = [];

  for (const status of statuses) {
    uniqueStatuses.push({
      label: status.name,
      value: status.id,
      color: status.color,
    });
  }

  const handleSearch: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = formData.get("search") as string;

    if (search === "-") {
      return;
    }

    if (search) {
      router.push(`/features/search?query=${encodeURIComponent(search)}`);
    } else {
      router.push("/features");
    }
  };

  const handleToolbarClose = () => {
    setRowSelection({});
  };

  if (isLoading) {
    return (
      <>
        <Header badge={count} breadcrumbs={breadcrumbs} title={title}>
          <div className="h-8 w-48 rounded-md bg-muted" />
        </Header>
        <div className="p-6 text-muted-foreground text-sm">
          Loading features…
        </div>
      </>
    );
  }

  return (
    <>
      <Header badge={count} breadcrumbs={breadcrumbs} title={title}>
        <FeaturesHeaderActions
          handleSearch={handleSearch}
          handleShow={handleShow}
          members={members}
          role={role}
          statusOptions={uniqueStatuses}
          table={table}
        />
      </Header>
      <FeaturesTable table={table} />

      {table.getFilteredSelectedRowModel().rows.length > 0 && editable ? (
        <FeaturesToolbar
          groups={groups}
          members={members}
          onClose={handleToolbarClose}
          products={products}
          releases={releases}
          selected={selectedRows}
          statuses={statuses}
        />
      ) : null}
    </>
  );
};

export const FeaturesList = (props: FeaturesListProperties) => (
  <Suspense fallback={null}>
    <FeaturesListContent {...props} />
  </Suspense>
);
