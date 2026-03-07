import { Skeleton } from "@repo/design-system/components/precomposed/skeleton";

const ActivityLoading = () => (
  <div className="mx-auto grid w-full max-w-3xl gap-6 p-6 py-16">
    <div className="grid gap-2">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-5 w-72" />
    </div>
    <Skeleton className="h-28 w-full" />
    <Skeleton className="h-28 w-full" />
    <Skeleton className="h-28 w-full" />
  </div>
);

export default ActivityLoading;
