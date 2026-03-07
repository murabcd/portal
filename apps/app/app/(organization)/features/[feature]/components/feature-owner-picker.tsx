"use client";

import { getUserName } from "@repo/backend/auth/format";
import type { Feature } from "@repo/backend/types";
import { Avatar } from "@repo/design-system/components/precomposed/avatar";
import { Select } from "@repo/design-system/components/precomposed/select";
import { handleError } from "@repo/design-system/lib/handle-error";
import { useState } from "react";
import { updateFeature } from "@/actions/feature/update";
import type { MemberInfo } from "@/lib/serialization";

type FeatureOwnerPickerProperties = {
  readonly featureId: Feature["id"];
  readonly defaultValue: string;
  readonly disabled: boolean;
  readonly data: MemberInfo[];
};

export const FeatureOwnerPicker = ({
  featureId,
  defaultValue,
  disabled,
  data,
}: FeatureOwnerPickerProperties) => {
  const [pendingValue, setPendingValue] = useState<string | undefined>();
  const value = pendingValue ?? defaultValue;

  const handleSelect = async (newValue: string) => {
    setPendingValue(newValue);

    try {
      const { error } = await updateFeature(featureId, { ownerId: newValue });

      if (error) {
        throw new Error(error);
      }
    } catch (error) {
      setPendingValue(undefined);
      handleError(error);
    }
  };

  return (
    <Select
      data={data.map((user) => ({
        label: getUserName(user),
        value: user.id,
      }))}
      disabled={disabled}
      onChange={handleSelect}
      renderItem={(item) => {
        const selectedUser = data.find((member) => member.id === item.value);

        if (!selectedUser) {
          return null;
        }

        return (
          <div className="flex items-center gap-2">
            <Avatar
              fallback={item.label.slice(0, 2)}
              src={selectedUser.image ?? undefined}
            />
            <span className="flex-1 truncate">{item.label}</span>
          </div>
        );
      }}
      type="user"
      value={value}
    />
  );
};
