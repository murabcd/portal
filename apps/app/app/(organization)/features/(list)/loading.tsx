import { Skeleton } from "@repo/design-system/components/precomposed/skeleton";

const FeaturesListLoading = () => (
  <div className="flex min-h-screen flex-1">
    <div className="w-[20%] min-w-72 border-r p-3">
      <Skeleton className="mb-3 h-10 w-36" />
      <Skeleton className="mb-3 h-14 w-full" />
      <Skeleton className="mb-3 h-14 w-full" />
      <Skeleton className="h-14 w-full" />
    </div>
    <div className="flex-1 p-3">
      <Skeleton className="mb-3 h-10 w-56" />
      <Skeleton className="mb-2 h-12 w-full" />
      <Skeleton className="mb-2 h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
);

export default FeaturesListLoading;
