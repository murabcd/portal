import { PortalRole, type User } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import {
  SidebarInset,
  SidebarProvider,
} from "@repo/design-system/components/ui/sidebar";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { Forms } from "./components/forms";
import { Navbar } from "./components/navbar";

type OrganizationLayoutProperties = {
  readonly children: ReactNode;
};

const OrganizationLayout = async ({
  children,
}: OrganizationLayoutProperties) => {
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!user) {
    redirect("/sign-in");
  }

  if (!organizationId) {
    redirect("/setup");
  }

  const organization = await database
    .select()
    .from(tables.organization)
    .where(eq(tables.organization.id, organizationId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!organization) {
    throw new Error("Organization not found");
  }

  const resolveDate = (value: unknown) => {
    if (value instanceof Date) {
      return value;
    }
    if (value) {
      return new Date(value as string);
    }
    return new Date();
  };

  const createdAt = resolveDate(user.createdAt);
  const updatedAt = resolveDate(user.updatedAt);

  const safeUser: User = {
    ...user,
    name: user.name ?? "",
    email: user.email ?? "",
    image: user.image ?? undefined,
    organizationId: user.organizationId ?? undefined,
    organizationRole: user.organizationRole ?? "member",
    emailVerified: Boolean(user.emailVerified),
    createdAt,
    updatedAt,
  };

  const sidebarUser = {
    id: safeUser.id,
    name: safeUser.name,
    email: safeUser.email,
    image: safeUser.image ?? undefined,
    organizationRole: (safeUser.organizationRole ??
      PortalRole.Member) as PortalRole,
  };

  const sidebarOrganization = {
    name: organization.name,
    slug: organization.slug,
    logoUrl: organization.logoUrl,
  };
  const sidebarCookie = (await cookies()).get("sidebar_state")?.value;
  const sidebarDefaultOpen = sidebarCookie
    ? sidebarCookie === "true"
    : undefined;

  return (
    <SidebarProvider defaultOpen={sidebarDefaultOpen}>
      <Sidebar organization={sidebarOrganization} user={sidebarUser} />
      <SidebarInset className="bg-transparent">
        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar />
          {children}
        </div>
      </SidebarInset>
      <Suspense fallback={null}>
        <Forms />
      </Suspense>
    </SidebarProvider>
  );
};

export default OrganizationLayout;
