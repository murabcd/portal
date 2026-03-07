"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { preload } from "swr";
import { deserializeActivityPage } from "@/lib/activity";
import { fetcher } from "@/lib/fetcher";

type PrefetchConfig = {
  readonly data?: readonly string[];
  readonly routes?: readonly string[];
};

const activityFirstPage = "/api/activity?page=0";
const changelogFirstPage = "/api/changelog";
const featureFirstPage = "/api/features";
const feedbackFirstPage = "/api/feedback?showProcessed=false";

const prefetchConfigs: Record<string, PrefetchConfig> = {
  "/": {
    routes: ["/"],
  },
  "/activity": {
    data: [activityFirstPage],
    routes: ["/activity"],
  },
  "/changelog": {
    data: [changelogFirstPage],
    routes: ["/changelog"],
  },
  "/data/companies": {
    data: ["/api/data/companies"],
    routes: ["/data/companies"],
  },
  "/data/users": {
    data: ["/api/data/users"],
    routes: ["/data/users"],
  },
  "/features": {
    data: [featureFirstPage],
    routes: ["/features"],
  },
  "/feedback": {
    data: [feedbackFirstPage],
    routes: ["/feedback"],
  },
  "/initiatives": {
    routes: ["/initiatives"],
  },
  "/insights": {
    routes: ["/insights"],
  },
  "/releases": {
    routes: ["/releases"],
  },
  "/roadmap": {
    routes: ["/roadmap", "/roadmap/calendar"],
  },
  "/roadmap/calendar": {
    routes: ["/roadmap/calendar"],
  },
  "/settings": {
    routes: ["/settings"],
  },
  "/settings/import": {
    routes: ["/settings/import"],
  },
  "/settings/integrations": {
    routes: ["/settings/integrations"],
  },
  "/settings/statuses": {
    routes: ["/settings/statuses"],
  },
};

const prefetchedData = new Set<string>();
const prefetchedRoutes = new Set<string>();
const dataPrefetchers: Partial<
  Record<string, (key: string) => Promise<unknown>>
> = {
  [activityFirstPage]: async (key: string) =>
    deserializeActivityPage(await fetcher(key)),
};

const prefetchData = (key: string) => {
  if (prefetchedData.has(key)) {
    return;
  }

  prefetchedData.add(key);
  preload(key, dataPrefetchers[key] ?? fetcher);
};

const prefetchRoute = (router: AppRouterInstance, href: string) => {
  if (prefetchedRoutes.has(href)) {
    return;
  }

  prefetchedRoutes.add(href);
  router.prefetch(href);
};

export const prefetchNavigationTarget = (
  router: AppRouterInstance,
  href: string
) => {
  const config = prefetchConfigs[href];

  if (!config) {
    prefetchRoute(router, href);
    return;
  }

  for (const route of config.routes ?? [href]) {
    prefetchRoute(router, route);
  }

  for (const key of config.data ?? []) {
    prefetchData(key);
  }
};

export const warmSidebarNavigation = (
  router: AppRouterInstance,
  hrefs: readonly string[]
) => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const run = () => {
    for (const href of hrefs) {
      prefetchNavigationTarget(router, href);
    }
  };

  if (typeof window === "undefined") {
    run();
    return;
  }

  if ("requestIdleCallback" in window) {
    const requestIdleCallback = window.requestIdleCallback.bind(window);
    requestIdleCallback(run, { timeout: 1500 });
    return;
  }

  globalThis.setTimeout(run, 200);
};
