"use client";

import { getUserName } from "@repo/backend/auth/format";
import type { Initiative } from "@repo/backend/types";
import { Avatar } from "@repo/design-system/components/precomposed/avatar";
import { Select } from "@repo/design-system/components/precomposed/select";
import { handleError } from "@repo/design-system/lib/handle-error";
import { useState } from "react";
import { updateInitiative } from "@/actions/initiative/update";
import type { MemberInfo } from "@/lib/serialization";

type InitiativeOwnerPickerProperties = {
  readonly initiativeId: Initiative["id"];
  readonly defaultValue: string;
  readonly disabled: boolean;
  readonly data: MemberInfo[];
};

export const InitiativeOwnerPicker = ({
  initiativeId,
  defaultValue,
  disabled,
  data,
}: InitiativeOwnerPickerProperties) => {
  const [pendingValue, setPendingValue] = useState<string | undefined>();
  const value = pendingValue ?? defaultValue;

  const handleSelect = async (newValue: string) => {
    setPendingValue(newValue);

    try {
      const { error } = await updateInitiative(initiativeId, {
        ownerId: newValue,
      });

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
      data={data.map((member) => ({
        label: getUserName(member),
        value: member.id,
      }))}
      disabled={disabled}
      onChange={handleSelect}
      renderItem={(item) => {
        const assignee = data.find((member) => member.id === item.value);

        if (!assignee) {
          return null;
        }

        return (
          <div className="flex items-center gap-2">
            <Avatar src={assignee.image ?? undefined} />
            <span className="flex-1 truncate">{item.label}</span>
          </div>
        );
      }}
      type="user"
      value={value}
    />
  );
};
