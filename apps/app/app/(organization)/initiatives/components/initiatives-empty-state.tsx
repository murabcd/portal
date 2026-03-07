import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { EmptyState } from "@/components/empty-state";
import { emptyStates } from "@/lib/empty-states";
import { CreateInitiativeButton } from "./create-initiative-button";

export const InitiativesEmptyState = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  return (
    <EmptyState {...emptyStates.initiative}>
      {user.organizationRole !== PortalRole.Member && (
        <CreateInitiativeButton />
      )}
    </EmptyState>
  );
};
