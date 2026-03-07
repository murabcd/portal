"use client";

import { authClient } from "@repo/backend/auth/client";
import { Input } from "@repo/design-system/components/precomposed/input";
import { Button } from "@repo/design-system/components/ui/button";
import { handleError } from "@repo/design-system/lib/handle-error";
import type { FormEventHandler } from "react";
import { useState } from "react";
import { toast } from "sonner";

type ProfileFormProps = {
  defaultName: string;
  defaultEmail: string;
};

export const ProfileForm = ({
  defaultName,
  defaultEmail,
}: ProfileFormProps) => {
  const [loading, setLoading] = useState(false);
  const [pendingName, setPendingName] = useState<string | undefined>();
  const name = pendingName ?? defaultName;
  const disabled = loading || name === defaultName;

  const updateProfile: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    try {
      if (disabled) {
        return;
      }

      setLoading(true);

      await authClient.updateUser({
        name,
      });

      toast.success("Profile updated");
    } catch (error) {
      setPendingName(undefined);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={updateProfile}>
      <Input
        label="Name"
        name="name"
        onChange={(e) => setPendingName(e.target.value)}
        placeholder="Your name"
        value={name}
      />
      <Input
        disabled
        label="Email"
        name="email"
        placeholder="Email"
        value={defaultEmail}
      />
      <Button disabled={disabled} type="submit">
        Update
      </Button>
    </form>
  );
};
