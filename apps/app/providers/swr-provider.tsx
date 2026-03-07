"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

type SWRProviderProperties = {
  readonly children: ReactNode;
};

export const SWRProvider = ({ children }: SWRProviderProperties) => (
  <SWRConfig
    value={{
      fetcher,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 2,
      dedupingInterval: 2000,
      keepPreviousData: true,
    }}
  >
    {children}
  </SWRConfig>
);
