import { cn } from "@repo/design-system/lib/utils";
import type { PenIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProperties = {
  readonly icon?: typeof PenIcon;
  readonly title: string;
  readonly description: string;
  readonly children?: ReactNode;
  readonly compact?: boolean;
  readonly className?: string;
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  children,
  compact = false,
  className,
}: EmptyStateProperties) => (
  <div
    className={cn(
      "flex h-full w-full items-center justify-center",
      compact ? "min-h-0" : "min-h-[calc(100dvh-8rem)]",
      className
    )}
  >
    <div className="max-w-md items-center gap-12 px-8">
      <div className="flex flex-col items-center text-center">
        {Icon ? (
          <Icon className="mb-4 text-muted-foreground" size={24} />
        ) : null}
        <p className="mb-2 font-medium text-foreground">{title}</p>
        <p className="mb-4 text-muted-foreground text-sm">{description}</p>
        {children}
      </div>
    </div>
  </div>
);
