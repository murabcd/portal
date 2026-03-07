import "server-only";

import { database, tables } from "@repo/backend/database";
import type { Template } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const deleteTemplate = async (
  id: Template["id"]
): Promise<{
  error?: string;
}> => {
  try {
    await database.delete(tables.template).where(eq(tables.template.id, id));

    revalidatePath("/settings/templates");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
