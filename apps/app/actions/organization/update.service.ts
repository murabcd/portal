import "server-only";

import { currentOrganizationId } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { Organization } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const updateOrganization = async (
  data: Partial<Organization>
): Promise<{
  error?: string;
}> => {
  try {
    const organizationId = await currentOrganizationId();

    if (!organizationId) {
      throw new Error("Not logged in");
    }

    await database
      .update(tables.organization)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(tables.organization.id, organizationId));

    revalidatePath("/", "layout");

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
