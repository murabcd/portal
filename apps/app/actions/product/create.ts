"use client";

import { postAction } from "@/lib/action-client";
import type { createProduct as createProductServer } from "./create.service";

export const createProduct = (
  ...args: Parameters<typeof createProductServer>
) =>
  postAction<Awaited<ReturnType<typeof createProductServer>>>(
    "/api/actions/product/create",
    {
      action: "createProduct",
      args,
    }
  );
