"use client";

import { postAction } from "@/lib/action-client";
import type { parseMarkdown as parseMarkdownServer } from "./parse.service";

export const parseMarkdown = (
  ...args: Parameters<typeof parseMarkdownServer>
) =>
  postAction<Awaited<ReturnType<typeof parseMarkdownServer>>>(
    "/api/actions/markdown/parse",
    {
      action: "parseMarkdown",
      args,
    }
  );
