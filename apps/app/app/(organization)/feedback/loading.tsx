import { Skeleton } from "@repo/design-system/components/precomposed/skeleton";

const FeedbackLoading = () => (
  <div className="flex min-h-screen flex-1 gap-0">
    <div className="w-[30%] min-w-80 border-r p-3">
      <Skeleton className="mb-3 h-10 w-40" />
      <Skeleton className="mb-3 h-20 w-full" />
      <Skeleton className="mb-3 h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
    <div className="flex-1 p-6">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="mt-4 h-72 w-full" />
    </div>
  </div>
);

export default FeedbackLoading;
