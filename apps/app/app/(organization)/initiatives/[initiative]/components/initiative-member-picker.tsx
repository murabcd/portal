"use client";

import { getUserName } from "@repo/backend/auth/format";
import type { Initiative } from "@repo/backend/types";
import { Select } from "@repo/design-system/components/precomposed/select";
import { Tooltip } from "@repo/design-system/components/precomposed/tooltip";
import { Button } from "@repo/design-system/components/ui/button";
import { handleError } from "@repo/design-system/lib/handle-error";
import { PlusIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { addInitiativeMember } from "@/actions/initiative-member/create";
import { deleteInitiativeMember } from "@/actions/initiative-member/delete";
import type { MemberInfo } from "@/lib/serialization";

type InitiativeMemberPickerProperties = {
  readonly initiativeId: Initiative["id"];
  readonly users: MemberInfo[];
  readonly defaultMembers: string[];
};

export const InitiativeMemberPicker = ({
  initiativeId,
  users,
  defaultMembers,
}: InitiativeMemberPickerProperties) => {
  const [loading, setLoading] = useState(false);
  const [pendingMembers, setPendingMembers] = useState<string[] | undefined>();
  const members = pendingMembers ?? defaultMembers;

  const handleAddMember = async (userId: string) => {
    setPendingMembers([...members, userId]);
    setLoading(true);

    try {
      const { error } = await addInitiativeMember({
        initiativeId,
        userId,
      });

      if (error) {
        throw new Error(error);
      }
    } catch (error) {
      setPendingMembers(undefined);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setPendingMembers(members.filter((id) => id !== userId));
    setLoading(true);

    try {
      const { error } = await deleteInitiativeMember({
        initiativeId,
        userId,
      });

      if (error) {
        throw new Error(error);
      }
    } catch (error) {
      setPendingMembers(undefined);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (userId: string | undefined) => {
    if (!userId) {
      return;
    }

    await (members.includes(userId)
      ? handleRemoveMember(userId)
      : handleAddMember(userId));
  };

  return (
    <Select
      data={users.map((user) => ({
        label: getUserName(user),
        value: user.id,
      }))}
      disabled={loading}
      onChange={handleSelect}
      renderItem={(item) => {
        const selectedUser = users.find((user) => user.id === item.value);

        if (!selectedUser) {
          return null;
        }

        return (
          <div className="flex items-center gap-2">
            {selectedUser.image ? (
              <Image
                alt={item.label}
                className="h-6 w-6 shrink-0 rounded-full object-cover"
                height={24}
                src={selectedUser.image}
                width={24}
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-card" />
            )}
            <span className="flex-1 truncate">{item.label}</span>
          </div>
        );
      }}
      trigger={
        <div>
          <Tooltip content="Add a new member">
            <Button className="-m-1.5 h-6 w-6" size="icon" variant="ghost">
              <PlusIcon size={16} />
              <span className="sr-only">Add a new member</span>
            </Button>
          </Tooltip>
        </div>
      }
      type="user"
      value={members}
    />
  );
};
