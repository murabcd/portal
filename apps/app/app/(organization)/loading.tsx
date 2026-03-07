import { Skeleton } from "@repo/design-system/components/precomposed/skeleton";

const OrganizationLoading = () => (
  <div className="flex min-h-screen flex-1 flex-col">
    <div className="flex items-center gap-4 border-b px-4 py-2.5">
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-4 w-40" />
    </div>
    <div className="grid gap-4 p-6">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  </div>
);

export default OrganizationLoading;
