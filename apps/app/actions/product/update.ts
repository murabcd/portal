"use client";

import { postAction } from "@/lib/action-client";
import type { updateProduct as updateProductServer } from "./update.service";

export const updateProduct = (
  ...args: Parameters<typeof updateProductServer>
) =>
  postAction<Awaited<ReturnType<typeof updateProductServer>>>(
    "/api/actions/product/update",
    {
      action: "updateProduct",
      args,
    }
  );
