"use client";

import type { Changelog } from "@repo/backend/types";
import { handleError } from "@repo/design-system/lib/handle-error";
import { PencilIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { generateChangelog } from "@/actions/changelog/generate";

type UpdateEmptyStateProperties = {
  changelogId: Changelog["id"];
};

export const UpdateEmptyState = ({
  changelogId,
}: UpdateEmptyStateProperties) => {
  const [loading, setLoading] = useState(false);
  const startTypes = [
    {
      id: "ai",
      label: "Generate with AI",
      description:
        "Portal will generate an update for you based on your roadmap.",
      icon: SparklesIcon,
      disabled: loading,
    },
    {
      id: "scratch",
      label: "Start from scratch",
      description: "Write your own update from scratch, no AI involved.",
      icon: PencilIcon,
      disabled: loading,
    },
  ];

  const handleClick = async (id: string) => {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const response = await generateChangelog(changelogId, id === "ai");

      if ("error" in response) {
        throw new Error(response.error);
      }
    } catch (error) {
      handleError(error);
      setLoading(false);
    }
  };

  return (
    <div className="grid w-full grid-cols-2 gap-4">
      {startTypes.map((option) => (
        <button
          className="space-y-2 rounded border bg-background p-4 transition-colors hover:bg-card disabled:cursor-not-allowed disabled:opacity-60"
          disabled={option.disabled}
          key={option.id}
          onClick={() => handleClick(option.id)}
          type="button"
        >
          <option.icon
            className="pointer-events-none mx-auto select-none text-muted-foreground"
            size={24}
          />
          <span className="pointer-events-none mt-2 block select-none font-medium text-sm">
            {option.label}
          </span>
          <span className="pointer-events-none block select-none text-muted-foreground text-sm">
            {option.description}
          </span>
        </button>
      ))}
    </div>
  );
};
