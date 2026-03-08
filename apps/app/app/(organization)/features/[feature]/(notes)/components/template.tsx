"use client";

import type { Template as TemplateClass } from "@repo/backend/types";
import { cn } from "@repo/design-system/lib/utils";
import type { JSONContent } from "@repo/editor";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";

export type TemplateProperties = Pick<
  TemplateClass,
  "description" | "id" | "title"
> & {
  readonly content?: TemplateClass["content"];
};

const Editor = dynamic(
  async () => {
    const Module = await import(
      /* webpackChunkName: "editor" */
      "@/components/editor"
    );

    return Module.Editor;
  },
  {
    ssr: false,
  }
);

export const Template = ({
  title,
  description,
  content,
  active,
  className,
  children,
}: TemplateProperties & {
  readonly active: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
}) => (
  <div
    className={cn(
      "flex aspect-[2/3] w-full flex-col divide-y overflow-hidden rounded-md border bg-background transition-colors",
      children ? "" : "hover:bg-card",
      active
        ? "border-transparent ring-2 ring-violet-500 dark:ring-violet-400"
        : "",
      className
    )}
  >
    <div className="flex-1 overflow-hidden p-3">
      {content ? (
        <div className="origin-top scale-50">
          <div className="-ml-[50%] h-[200%] w-[200%]">
            <Editor defaultValue={content as JSONContent} editable={false} />
          </div>
        </div>
      ) : (
        <div className="grid h-full gap-3 rounded-md border border-dashed p-3">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
          <div className="h-24 rounded bg-muted/60" />
        </div>
      )}
    </div>
    <div className="flex shrink-0 items-start justify-between gap-4 p-3">
      <div>
        <p className="m-0 truncate text-foreground text-sm">{title}</p>
        <p className="m-0 truncate text-muted-foreground text-sm">
          {description}
        </p>
      </div>
      {children}
    </div>
  </div>
);
