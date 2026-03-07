"use client";

import { postAction } from "@/lib/action-client";
import type { linkInitiativeProduct as linkInitiativeProductServer } from "./link-initiative-product.service";

export const linkInitiativeProduct = (
  ...args: Parameters<typeof linkInitiativeProductServer>
) =>
  postAction<Awaited<ReturnType<typeof linkInitiativeProductServer>>>(
    "/api/internal-actions/app/(organization)/initiatives/[initiative]/actions/link-initiative-product",
    {
      action: "linkInitiativeProduct",
      args,
    }
  );
