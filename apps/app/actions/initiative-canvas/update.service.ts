import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import type { InitiativeCanvas } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { eq } from "drizzle-orm";
import { database } from "@/lib/database";

export const updateInitiativeCanvas = async (
  initiativeCanvasId: InitiativeCanvas["id"],
  data: Omit<Partial<InitiativeCanvas>, "content"> & {
    content?: JsonValue;
  }
): Promise<{
  error?: string;
}> => {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Organization not found");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error(
        "You don't have permission to update initiative canvases"
      );
    }

    await database
      .update(tables.initiativeCanvas)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(tables.initiativeCanvas.id, initiativeCanvasId));

    return {};
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
