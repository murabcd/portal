"use client";

import { PortalRole } from "@repo/backend/auth";
import type { Group, Product } from "@repo/backend/types";
import { Button } from "@repo/design-system/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useFeatureForm } from "@/components/feature-form/use-feature-form";
import { emptyStates } from "@/lib/empty-states";

type FeaturesEmptyStateProperties = {
  readonly groupId?: Group["id"];
  readonly productId?: Product["id"];
  readonly role?: string;
};

export const FeaturesEmptyState = ({
  groupId,
  productId,
  role,
}: FeaturesEmptyStateProperties) => {
  const { show } = useFeatureForm();

  const handleShow = () => show({ groupId, productId });

  return (
    <EmptyState {...emptyStates.feature}>
      {role !== PortalRole.Member && (
        <Button className="w-fit" onClick={handleShow}>
          Create a feature
        </Button>
      )}
    </EmptyState>
  );
};
