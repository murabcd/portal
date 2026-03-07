"use client";

import type { Feature, Template } from "@repo/backend/types";
import { AlertDialog } from "@repo/design-system/components/precomposed/alert-dialog";
import { Dialog } from "@repo/design-system/components/precomposed/dialog";
import { DropdownMenu } from "@repo/design-system/components/precomposed/dropdown-menu";
import { Input } from "@repo/design-system/components/precomposed/input";
import { Select } from "@repo/design-system/components/precomposed/select";
import { Tooltip } from "@repo/design-system/components/precomposed/tooltip";
import { Button } from "@repo/design-system/components/ui/button";
import { handleError } from "@repo/design-system/lib/handle-error";
import { toast } from "@repo/design-system/lib/toast";
import { QueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEventHandler } from "react";
import { useReducer } from "react";
import { deleteFeature } from "@/actions/feature/delete";
import { createTemplateFromFeature } from "@/actions/template/create";
import { updateTemplateFromFeature } from "@/actions/template/update";
import { OrDivider } from "@/components/or-divider";

type FeatureSettingsDropdownProperties = {
  readonly featureId: Feature["id"];
  readonly templates: Pick<Template, "id" | "title">[];
};

type FeatureSettingsDropdownState = {
  readonly deleteOpen: boolean;
  readonly existingTemplateId: Template["id"] | undefined;
  readonly loading: boolean;
  readonly saveTemplateOpen: boolean;
  readonly templateDescription: string;
  readonly templateName: string;
};

type FeatureSettingsDropdownAction =
  | { readonly type: "set-delete-open"; readonly value: boolean }
  | {
      readonly type: "set-existing-template-id";
      readonly value: Template["id"] | undefined;
    }
  | { readonly type: "set-loading"; readonly value: boolean }
  | { readonly type: "set-save-template-open"; readonly value: boolean }
  | { readonly type: "set-template-description"; readonly value: string }
  | { readonly type: "set-template-name"; readonly value: string }
  | { readonly type: "reset-template-form" };

const createFeatureSettingsDropdownState =
  (): FeatureSettingsDropdownState => ({
    deleteOpen: false,
    existingTemplateId: undefined,
    loading: false,
    saveTemplateOpen: false,
    templateDescription: "",
    templateName: "",
  });

const featureSettingsDropdownReducer = (
  state: FeatureSettingsDropdownState,
  action: FeatureSettingsDropdownAction
): FeatureSettingsDropdownState => {
  switch (action.type) {
    case "reset-template-form": {
      return {
        ...state,
        existingTemplateId: undefined,
        saveTemplateOpen: false,
        templateDescription: "",
        templateName: "",
      };
    }
    case "set-delete-open": {
      return { ...state, deleteOpen: action.value };
    }
    case "set-existing-template-id": {
      return { ...state, existingTemplateId: action.value };
    }
    case "set-loading": {
      return { ...state, loading: action.value };
    }
    case "set-save-template-open": {
      return { ...state, saveTemplateOpen: action.value };
    }
    case "set-template-description": {
      return { ...state, templateDescription: action.value };
    }
    case "set-template-name": {
      return { ...state, templateName: action.value };
    }
    default: {
      return state;
    }
  }
};

export const FeatureSettingsDropdown = ({
  featureId,
  templates,
}: FeatureSettingsDropdownProperties) => {
  const [state, dispatch] = useReducer(
    featureSettingsDropdownReducer,
    undefined,
    createFeatureSettingsDropdownState
  );
  const {
    deleteOpen,
    existingTemplateId,
    loading,
    saveTemplateOpen,
    templateDescription,
    templateName,
  } = state;
  const queryClient = new QueryClient();
  const router = useRouter();

  const handleDelete = async () => {
    if (loading) {
      return;
    }

    dispatch({ type: "set-loading", value: true });

    try {
      const { error } = await deleteFeature(featureId);

      if (error) {
        throw new Error(error);
      }

      dispatch({ type: "set-delete-open", value: false });
      router.push("/features");
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: "set-loading", value: false });
    }
  };

  const handleSaveTemplate: FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();

    if (loading || !templateName.trim()) {
      return;
    }

    dispatch({ type: "set-loading", value: true });

    try {
      const response = await createTemplateFromFeature(
        featureId,
        templateName,
        templateDescription
      );

      if ("error" in response) {
        throw new Error(response.error);
      }

      await queryClient.invalidateQueries({
        queryKey: ["templates"],
      });

      toast.success("Template created successfully");
      dispatch({ type: "reset-template-form" });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: "set-loading", value: false });
    }
  };

  const handleUpdateTemplate: FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();

    if (loading || !existingTemplateId) {
      return;
    }

    dispatch({ type: "set-save-template-open", value: false });
    dispatch({ type: "set-loading", value: true });

    try {
      await updateTemplateFromFeature(existingTemplateId, featureId);

      await queryClient.invalidateQueries({
        queryKey: ["templates"],
      });

      toast.success("Template updated successfully");
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: "set-loading", value: false });
    }
  };

  return (
    <>
      <div className="absolute top-2 right-2">
        <DropdownMenu
          data={[
            {
              onClick: () => dispatch({ type: "set-delete-open", value: true }),
              disabled: loading,
              children: "Delete",
            },
            {
              onClick: () =>
                dispatch({ type: "set-save-template-open", value: true }),
              disabled: loading,
              children: "Save as Template",
            },
          ]}
        >
          <Tooltip align="end" content="Settings" side="bottom">
            <Button size="icon" variant="ghost">
              <MoreHorizontalIcon size={16} />
            </Button>
          </Tooltip>
        </DropdownMenu>
      </div>

      <AlertDialog
        description="This action cannot be undone. This will permanently delete this feature."
        disabled={loading}
        onClick={handleDelete}
        onOpenChange={(value) => dispatch({ type: "set-delete-open", value })}
        open={deleteOpen}
        title="Are you absolutely sure?"
      />

      <Dialog
        description="Save this feature's content as a template for future use."
        disabled={loading || !templateName.trim()}
        onOpenChange={(value) =>
          dispatch({ type: "set-save-template-open", value })
        }
        open={saveTemplateOpen}
        title="Save as Template"
      >
        <form className="space-y-4" onSubmit={handleSaveTemplate}>
          <Input
            autoComplete="off"
            label="Title"
            maxLength={191}
            onChangeText={(value) =>
              dispatch({ type: "set-template-name", value })
            }
            placeholder="My Template"
            required
            value={templateName}
          />

          <Input
            autoComplete="off"
            label="Description"
            maxLength={191}
            onChangeText={(value) =>
              dispatch({ type: "set-template-description", value })
            }
            placeholder="A brief description of the template"
            value={templateDescription}
          />

          <Button disabled={loading || !templateName.trim()} type="submit">
            Save as Template
          </Button>
        </form>

        {templates.length > 0 ? (
          <>
            <OrDivider />
            <form
              className="flex items-center gap-2"
              onSubmit={handleUpdateTemplate}
            >
              <Select
                data={templates.map((template) => ({
                  label: template.title,
                  value: template.id,
                }))}
                onChange={(value) =>
                  dispatch({ type: "set-existing-template-id", value })
                }
                type="template"
                value={existingTemplateId}
              />
              <Button
                className="shrink-0"
                disabled={loading || !existingTemplateId}
                type="submit"
                variant="secondary"
              >
                Update template
              </Button>
            </form>
          </>
        ) : null}
      </Dialog>
    </>
  );
};
