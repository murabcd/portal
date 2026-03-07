"use client";

import type { User } from "@repo/backend/auth";
import { getUserName } from "@repo/backend/auth/format";
import type { Changelog } from "@repo/backend/types";
import { Select } from "@repo/design-system/components/precomposed/select";
import { Tooltip } from "@repo/design-system/components/precomposed/tooltip";
import { Button } from "@repo/design-system/components/ui/button";
import { handleError } from "@repo/design-system/lib/handle-error";
import { PlusIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { addChangelogContributor } from "@/actions/changelog-contributor/create";
import { deleteChangelogContributor } from "@/actions/changelog-contributor/delete";

type ChangelogContributorsPickerProperties = {
  readonly changelogId: Changelog["id"];
  readonly users: User[];
  readonly defaultContributors: string[];
};

export const ChangelogContributorsPicker = ({
  changelogId,
  users,
  defaultContributors,
}: ChangelogContributorsPickerProperties) => {
  const [loading, setLoading] = useState(false);
  const [pendingContributors, setPendingContributors] = useState<
    string[] | undefined
  >();
  const contributors = pendingContributors ?? defaultContributors;

  const handleAddContributor = async (userId: string) => {
    setPendingContributors([...contributors, userId]);
    setLoading(true);

    try {
      const { error } = await addChangelogContributor({
        changelogId,
        userId,
      });

      if (error) {
        throw new Error(error);
      }
    } catch (error) {
      setPendingContributors(undefined);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveContributor = async (userId: string) => {
    setPendingContributors(contributors.filter((id) => id !== userId));
    setLoading(true);

    try {
      const { error } = await deleteChangelogContributor({
        changelogId,
        userId,
      });

      if (error) {
        throw new Error(error);
      }
    } catch (error) {
      setPendingContributors(undefined);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (userId: string | undefined) => {
    if (!userId) {
      return;
    }

    await (contributors.includes(userId)
      ? handleRemoveContributor(userId)
      : handleAddContributor(userId));
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
                alt=""
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
          <Tooltip content="Add a new contributor">
            <Button className="-m-1.5 h-6 w-6" size="icon" variant="ghost">
              <PlusIcon size={16} />
              <span className="sr-only">Add a new contributor</span>
            </Button>
          </Tooltip>
        </div>
      }
      type="user"
      value={contributors}
    />
  );
};
