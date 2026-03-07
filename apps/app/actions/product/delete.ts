"use client";

import { postAction } from "@/lib/action-client";
import type { deleteProduct as deleteProductServer } from "./delete.service";

export const deleteProduct = (
  ...args: Parameters<typeof deleteProductServer>
) =>
  postAction<Awaited<ReturnType<typeof deleteProductServer>>>(
    "/api/actions/product/delete",
    {
      action: "deleteProduct",
      args,
    }
  );
