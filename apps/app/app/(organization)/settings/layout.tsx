import { PortalRole } from "@repo/backend/auth";
import { currentOrganizationId, currentUser } from "@repo/backend/auth/utils";
import { notFound } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { SettingsNavigation } from "./components/settings-navigation";

type SettingsLayoutProperties = {
  readonly children: ReactNode;
};

const SettingsLayout = async ({ children }: SettingsLayoutProperties) => {
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId) || user.organizationRole !== PortalRole.Admin) {
    notFound();
  }

  return (
    <div className="flex min-w-0 flex-1">
      <aside className="sticky top-0 h-screen w-72 shrink-0 overflow-y-auto border-r">
        <Suspense fallback={null}>
          <SettingsNavigation />
        </Suspense>
      </aside>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {children}
      </div>
    </div>
  );
};

export default SettingsLayout;
