import "server-only";

import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { Product } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const createProduct = async (
  name: Product["name"]
): Promise<{
  id?: Product["id"];
  error?: string;
}> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("You must be logged in to create a product.");
    }

    const id = createId();
    const now = new Date().toISOString();
    await database.insert(tables.product).values([
      {
        id,
        name,
        creatorId: user.id,
        organizationId,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    revalidatePath("/features");

    return { id };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
