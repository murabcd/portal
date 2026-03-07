"use client";

import type { Feature, Group } from "@repo/backend/types";
import { Emoji } from "@repo/design-system/components/emoji";
import { Select } from "@repo/design-system/components/precomposed/select";
import { handleError } from "@repo/design-system/lib/handle-error";
import { toast } from "@repo/design-system/lib/toast";
import { useState } from "react";
import { updateFeature } from "@/actions/feature/update";

type FeatureGroupPickerProperties = {
  readonly featureId: Feature["id"];
  readonly defaultValue: string | undefined;
  readonly disabled: boolean;
  readonly data: Pick<Group, "id" | "name" | "emoji">[];
};

export const FeatureGroupPicker = ({
  featureId,
  defaultValue,
  disabled,
  data,
}: FeatureGroupPickerProperties) => {
  const [loading, setLoading] = useState(false);
  const [pendingValue, setPendingValue] = useState<string | undefined>();
  const value = pendingValue ?? defaultValue;

  const handleSelect = async (newValue: string) => {
    if (newValue === value || loading) {
      return;
    }

    setPendingValue(newValue);
    setLoading(true);

    try {
      const { error } = await updateFeature(featureId, { groupId: newValue });

      if (error) {
        throw new Error(error);
      }

      toast.success("Group updated");
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
        const selectedGroup = data.find((group) => group.id === item.value);

        if (!selectedGroup) {
          return null;
        }

        return (
          <div className="flex items-center gap-2">
            <Emoji id={selectedGroup.emoji} size="0.825rem" />
            <span className="flex-1 truncate">{item.label}</span>
          </div>
        );
      }}
      type="group"
      value={value}
    />
  );
};
