import { PortalRole } from "@repo/backend/auth";
import {
  currentMembers,
  currentOrganizationId,
  currentUser,
} from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { toMemberInfoList } from "@/lib/serialization";

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

    const [products, groups, atlassianInstallation, members] =
      await Promise.all([
        database
          .select({
            id: tables.product.id,
            name: tables.product.name,
            emoji: tables.product.emoji,
          })
          .from(tables.product)
          .where(eq(tables.product.organizationId, organizationId))
          .orderBy(asc(tables.product.name)),
        database
          .select({
            id: tables.group.id,
            name: tables.group.name,
            productId: tables.group.productId,
            parentGroupId: tables.group.parentGroupId,
            emoji: tables.group.emoji,
          })
          .from(tables.group)
          .where(eq(tables.group.organizationId, organizationId))
          .orderBy(asc(tables.group.name)),
        database
          .select({ accessToken: tables.atlassianInstallation.accessToken })
          .from(tables.atlassianInstallation)
          .where(
            eq(tables.atlassianInstallation.organizationId, organizationId)
          )
          .limit(1)
          .then((rows) => rows[0] ?? null),
        currentMembers(),
      ]);

    return NextResponse.json({
      groups,
      hasProducts: products.length > 0,
      jiraAccessToken: atlassianInstallation?.accessToken,
      members: toMemberInfoList(members),
      products,
    });
  } catch {
    return new NextResponse("Failed to load admin form data", { status: 500 });
  }
};
