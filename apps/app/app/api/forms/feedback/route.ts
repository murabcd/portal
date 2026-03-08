import { currentOrganizationId } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const organizationId = await currentOrganizationId();

    if (!organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [users, organizations] = await Promise.all([
      database
        .select({
          id: tables.feedbackUser.id,
          feedbackOrganizationId: tables.feedbackUser.feedbackOrganizationId,
          name: tables.feedbackUser.name,
          imageUrl: tables.feedbackUser.imageUrl,
          email: tables.feedbackUser.email,
        })
        .from(tables.feedbackUser)
        .where(eq(tables.feedbackUser.organizationId, organizationId))
        .orderBy(asc(tables.feedbackUser.name)),
      database
        .select({
          id: tables.feedbackOrganization.id,
          name: tables.feedbackOrganization.name,
          domain: tables.feedbackOrganization.domain,
        })
        .from(tables.feedbackOrganization)
        .where(eq(tables.feedbackOrganization.organizationId, organizationId))
        .orderBy(asc(tables.feedbackOrganization.name)),
    ]);

    return NextResponse.json({
      organizations,
      users,
    });
  } catch {
    return new NextResponse("Failed to load feedback form data", {
      status: 500,
    });
  }
};
