import "server-only";

import { tables } from "@repo/backend/database";
import type { Group } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const deleteGroup = async (
  id: Group["id"]
): Promise<{
  error?: string;
}> => {
  try {
    await database.delete(tables.group).where(eq(tables.group.id, id));

    revalidatePath("/features");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
