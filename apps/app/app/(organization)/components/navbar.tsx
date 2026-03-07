import { SidebarTrigger } from "@repo/design-system/components/ui/sidebar";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const GlobalBreadcrumbs = dynamic(
  () => import("./global-breadcrumbs").then((mod) => mod.GlobalBreadcrumbs),
  { loading: () => null }
);

export const Navbar = () => (
  <div className="sticky top-0 z-30 flex shrink-0 items-center gap-4 border-b bg-backdrop/90 px-4 py-2.5 backdrop-blur-sm">
    <SidebarTrigger className="text-muted-foreground" />
    <Suspense fallback={null}>
      <GlobalBreadcrumbs />
    </Suspense>
  </div>
);
