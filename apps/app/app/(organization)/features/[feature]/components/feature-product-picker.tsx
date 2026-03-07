"use client";

import type { Feature, Product } from "@repo/backend/types";
import { Emoji } from "@repo/design-system/components/emoji";
import { Select } from "@repo/design-system/components/precomposed/select";
import { handleError } from "@repo/design-system/lib/handle-error";
import { toast } from "@repo/design-system/lib/toast";
import { useState } from "react";
import { updateFeature } from "@/actions/feature/update";

type FeatureProductPickerProperties = {
  readonly featureId: Feature["id"];
  readonly defaultValue: string | undefined;
  readonly disabled: boolean;
  readonly data: Pick<Product, "id" | "name" | "emoji">[];
};

export const FeatureProductPicker = ({
  featureId,
  defaultValue,
  disabled,
  data,
}: FeatureProductPickerProperties) => {
  const [loading, setLoading] = useState(false);
  const [pendingValue, setPendingValue] = useState<string | undefined>();
  const value = pendingValue ?? defaultValue;

  const handleSelect = async (newValue: string) => {
    if (newValue === value || loading) {
      return;
    }

    setLoading(true);
    setPendingValue(newValue);

    try {
      const { error } = await updateFeature(featureId, { productId: newValue });

      if (error) {
        throw new Error(error);
      }

      toast.success("Product updated");
    } catch (error) {
      setPendingValue(undefined);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      data={data.map((group) => ({
        label: group.name,
        value: group.id,
      }))}
      disabled={disabled || loading}
      onChange={handleSelect}
      renderItem={(item) => {
        const selectedProduct = data.find(
          (product) => product.id === item.value
        );

        if (!selectedProduct) {
          return null;
        }

        return (
          <div className="flex items-center gap-2">
            <Emoji id={selectedProduct.emoji} size="0.825rem" />
            <span className="flex-1 truncate">{item.label}</span>
          </div>
        );
      }}
      type="product"
      value={value}
    />
  );
};
