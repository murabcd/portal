import "server-only";

import { tables } from "@repo/backend/database";
import type { Product } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const updateProduct = async (
  id: Product["id"],
  data: Partial<Product>
): Promise<{
  error?: string;
}> => {
  try {
    await database
      .update(tables.product)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(tables.product.id, id));

    revalidatePath("/features");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
