import "server-only";

import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { createId } from "@repo/backend/id";
import type { RoadmapEvent } from "@repo/backend/types";
import { parseError } from "@repo/lib/parse-error";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/database";

export const createMarker = async (
  text: RoadmapEvent["text"],
  date: RoadmapEvent["date"] | Date
): Promise<
  | {
      error: string;
    }
  | {
      id: string;
    }
> => {
  try {
    const [user, organizationId] = await Promise.all([
      currentUser(),
      currentOrganizationId(),
    ]);

    if (!(user && organizationId)) {
      throw new Error("Not logged in");
    }

    if (user.organizationRole === PortalRole.Member) {
      throw new Error("You don't have permission to create a marker");
    }

    const id = createId();
    const now = new Date().toISOString();
    await database.insert(tables.roadmapEvent).values([
      {
        id,
        organizationId,
        text,
        date:
          typeof date === "string"
            ? new Date(date).toISOString()
            : date.toISOString(),
        creatorId: user.id,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    revalidatePath("/roadmap");

    return { id };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
