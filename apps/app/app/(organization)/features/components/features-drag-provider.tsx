"use client";

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { Group, Product } from "@repo/backend/types";
import { handleError } from "@repo/design-system/lib/handle-error";
import { toast } from "@repo/design-system/lib/toast";
import type { ReactNode } from "react";
import { Suspense, useState } from "react";
import type { GetFeatureResponse } from "@/actions/feature/get";
import { updateFeature } from "@/actions/feature/update";
import { FeatureItem } from "./feature-item";

type FeaturesDragProviderProperties = {
  readonly products: (Pick<Product, "emoji" | "id" | "name"> & {
    readonly groups: Pick<Group, "emoji" | "id" | "name" | "parentGroupId">[];
  })[];
  readonly features: GetFeatureResponse[];
  readonly children: ReactNode;
};

type GroupItem =
  FeaturesDragProviderProperties["products"][number]["groups"][number];

export const FeaturesDragProvider = ({
  features,
  products,
  children,
}: FeaturesDragProviderProperties) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    if (!active.id) {
      return;
    }

    setActiveId(active.id.toString());
  };

  const updateFeatureLocation = async (
    featureId: string,
    payload: { productId: string | null; groupId: string | null },
    successMessage: string
  ) => {
    try {
      await updateFeature(featureId, payload);
      toast.success(successMessage);
    } catch (error) {
      handleError(error);
    }
  };

  const findProductById = (id: string) =>
    products.find((product) => product.id === id);

  const findGroupById = (id: string) =>
    products
      .flatMap((product) => product.groups)
      .find((group) => group.id === id);

  const findProductByGroup = (group: GroupItem) =>
    products.find((product) => product.groups.includes(group));

  const handleDragEnd = async ({ over }: DragEndEvent) => {
    if (!(over && activeId)) {
      return;
    }

    const overId = over.id.toString();
    const product = findProductById(overId);

    // Moved to a product
    if (product) {
      await updateFeatureLocation(
        activeId,
        { productId: product.id, groupId: null },
        `Successfully moved feature to ${product.name}`
      );
      setActiveId(null);
      return;
    }

    const group = findGroupById(overId);

    // Moved to "All"
    if (!group) {
      await updateFeatureLocation(
        activeId,
        { productId: null, groupId: null },
        "Successfully removed feature from products and groups."
      );
      setActiveId(null);
      return;
    }

    // Moved to a group
    const groupProduct = findProductByGroup(group);

    if (!groupProduct) {
      handleError("Product not found");
      setActiveId(null);
      return;
    }

    await updateFeatureLocation(
      activeId,
      {
        productId: groupProduct.id,
        groupId: group.id,
      },
      `Successfully moved feature to ${group.name} under ${groupProduct.name}`
    );

    setActiveId(null);
  };

  const activeFeature = features.find((feature) => feature.id === activeId);

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      {children}
      <DragOverlay>
        {activeFeature ? (
          <div className="max-w-sm overflow-hidden rounded opacity-70">
            <Suspense fallback={null}>
              <FeatureItem feature={activeFeature} />
            </Suspense>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
