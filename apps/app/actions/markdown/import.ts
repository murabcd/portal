"use client";

import { postAction } from "@/lib/action-client";
import type { importMarkdown as importMarkdownServer } from "./import.service";

export const importMarkdown = (
  ...args: Parameters<typeof importMarkdownServer>
) =>
  postAction<Awaited<ReturnType<typeof importMarkdownServer>>>(
    "/api/actions/markdown/import",
    {
      action: "importMarkdown",
      args,
    }
  );
