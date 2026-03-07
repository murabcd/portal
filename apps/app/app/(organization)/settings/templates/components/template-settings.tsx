"use client";

import type { Template as TemplateClass } from "@repo/backend/types";
import { AlertDialog } from "@repo/design-system/components/precomposed/alert-dialog";
import { Dialog } from "@repo/design-system/components/precomposed/dialog";
import { DropdownMenu } from "@repo/design-system/components/precomposed/dropdown-menu";
import { Input } from "@repo/design-system/components/precomposed/input";
import { Button } from "@repo/design-system/components/ui/button";
import { handleError } from "@repo/design-system/lib/handle-error";
import { toast } from "@repo/design-system/lib/toast";
import { EllipsisIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReducer } from "react";
import { deleteTemplate } from "@/actions/template/delete";
import { updateTemplate } from "@/actions/template/update";

type TemplateSettingsProps = {
  readonly templateId: TemplateClass["id"];
  readonly defaultTitle: TemplateClass["title"];
  readonly defaultDescription: TemplateClass["description"];
};

type TemplateSettingsState = {
  deleteOpen: boolean;
  description: string;
  loading: boolean;
  renameOpen: boolean;
  title: string;
};

type TemplateSettingsAction =
  | { type: "set-delete-open"; value: boolean }
  | { type: "set-description"; value: string }
  | { type: "set-loading"; value: boolean }
  | { type: "set-rename-open"; value: boolean }
  | { type: "set-title"; value: string };

const createInitialState = (
  title: string,
  description: string | null
): TemplateSettingsState => ({
  deleteOpen: false,
  description: description ?? "",
  loading: false,
  renameOpen: false,
  title,
});

const templateSettingsReducer = (
  state: TemplateSettingsState,
  action: TemplateSettingsAction
): TemplateSettingsState => {
  switch (action.type) {
    case "set-delete-open":
      return { ...state, deleteOpen: action.value };
    case "set-description":
      return { ...state, description: action.value };
    case "set-loading":
      return { ...state, loading: action.value };
    case "set-rename-open":
      return { ...state, renameOpen: action.value };
    case "set-title":
      return { ...state, title: action.value };
    default:
      return state;
  }
};

export const TemplateSettings = ({
  templateId,
  defaultTitle,
  defaultDescription,
}: TemplateSettingsProps) => {
  const [state, dispatch] = useReducer(
    templateSettingsReducer,
    { title: defaultTitle, description: defaultDescription },
    ({ title, description }) => createInitialState(title, description)
  );
  const { deleteOpen, description, loading, renameOpen, title } = state;
  const router = useRouter();

  const handleDelete = async () => {
    if (loading) {
      return;
    }

    dispatch({ type: "set-loading", value: true });

    try {
      const { error } = await deleteTemplate(templateId);

      if (error) {
        throw new Error(error);
      }

      toast.success("Template deleted successfully");
      dispatch({ type: "set-delete-open", value: false });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: "set-loading", value: false });
    }
  };

  const handleRename = async () => {
    if (loading || !title.trim()) {
      return;
    }

    dispatch({ type: "set-loading", value: true });

    try {
      const { error } = await updateTemplate(templateId, {
        title,
        description,
      });

      if (error) {
        throw new Error(error);
      }

      toast.success("template renamed successfully");
      dispatch({ type: "set-rename-open", value: false });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: "set-loading", value: false });
    }
  };
  return (
    <>
      <DropdownMenu
        data={[
          {
            onClick: () => dispatch({ type: "set-rename-open", value: true }),
            disabled: loading,
            children: "Rename",
          },
          {
            onClick: () => router.push(`/settings/templates/${templateId}`),
            disabled: loading,
            children: "Edit",
          },
          {
            onClick: () => dispatch({ type: "set-delete-open", value: true }),
            disabled: loading,
            children: "Delete",
          },
        ]}
      >
        <Button size="icon" variant="ghost">
          <EllipsisIcon className="text-muted-foreground" size={16} />
        </Button>
      </DropdownMenu>

      <AlertDialog
        description="This action cannot be undone. This will permanently this template."
        disabled={loading}
        onClick={handleDelete}
        onOpenChange={(value) => dispatch({ type: "set-delete-open", value })}
        open={deleteOpen}
        title="Are you absolutely sure?"
      />

      <Dialog
        cta="Rename"
        description="What would you like to rename this template to?"
        disabled={loading || !title.trim()}
        onClick={handleRename}
        onOpenChange={(value) => dispatch({ type: "set-rename-open", value })}
        open={renameOpen}
        title="Rename template"
      >
        <Input
          autoComplete="off"
          label="Title"
          maxLength={191}
          onChangeText={(value) => dispatch({ type: "set-title", value })}
          placeholder="My new template"
          value={title}
        />
        <Input
          autoComplete="off"
          label="Description"
          maxLength={191}
          onChangeText={(value) => dispatch({ type: "set-description", value })}
          placeholder="My template description"
          value={description ?? ""}
        />
      </Dialog>
    </>
  );
};
