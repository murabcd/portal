"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, PropsWithChildren } from "react";
import { prefetchNavigationTarget } from "@/lib/navigation-prefetch";

type SidebarRouteLinkProperties = PropsWithChildren<{
  readonly href: string;
}> &
  Omit<ComponentProps<typeof Link>, "children" | "href">;

export const SidebarRouteLink = ({
  children,
  href,
  onFocus,
  onMouseEnter,
  onTouchStart,
  ...properties
}: SidebarRouteLinkProperties) => {
  const router = useRouter();

  const handlePrefetch = () => {
    prefetchNavigationTarget(router, href);
  };

  return (
    <Link
      href={href}
      onFocus={(event) => {
        handlePrefetch();
        onFocus?.(event);
      }}
      onMouseEnter={(event) => {
        handlePrefetch();
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        handlePrefetch();
        onTouchStart?.(event);
      }}
      prefetch
      {...properties}
    >
      {children}
    </Link>
  );
};
