"use client";

import { PortalRole } from "@repo/backend/auth";
import { Button } from "@repo/design-system/components/ui/button";
import { useChangelogForm } from "@/components/changelog-form/use-changelog-form";
import { EmptyState } from "@/components/empty-state";
import { emptyStates } from "@/lib/empty-states";

type ChangelogEmptyStateProperties = {
  readonly role: PortalRole;
};

export const ChangelogEmptyState = ({
  role,
}: ChangelogEmptyStateProperties) => {
  const { show } = useChangelogForm();
  const handleShow = () => show();

  return (
    <EmptyState {...emptyStates.changelog}>
      {role === PortalRole.Member ? null : (
        <Button className="w-fit" onClick={handleShow} variant="outline">
          Create a product update
        </Button>
      )}
    </EmptyState>
  );
};
