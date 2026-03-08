import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const [organizationId, user] = await Promise.all([
      currentOrganizationId(),
      currentUser(),
    ]);

    if (!organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!user || user.organizationRole === PortalRole.Member) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const product = await database
      .select({ id: tables.product.id })
      .from(tables.product)
      .where(eq(tables.product.organizationId, organizationId))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    return NextResponse.json({
      hasProducts: Boolean(product),
    });
  } catch {
    return new NextResponse("Failed to load command bar data", { status: 500 });
  }
};
