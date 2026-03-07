"use client";

export type { FetchLinkResponse } from "./fetch-link.service";

import { postAction } from "@/lib/action-client";
import type { fetchLink as fetchLinkServer } from "./fetch-link.service";

export const fetchLink = (...args: Parameters<typeof fetchLinkServer>) =>
  postAction<Awaited<ReturnType<typeof fetchLinkServer>>>(
    "/api/internal-actions/components/editor/plugins/feedback-link/fetch-link",
    {
      action: "fetchLink",
      args,
    }
  );
