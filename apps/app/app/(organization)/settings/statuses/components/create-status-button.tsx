"use client";

import { Dialog } from "@repo/design-system/components/precomposed/dialog";
import { Input } from "@repo/design-system/components/precomposed/input";
import { Switch } from "@repo/design-system/components/precomposed/switch";
import { Button } from "@repo/design-system/components/ui/button";
import { Label } from "@repo/design-system/components/ui/label";
import { colors } from "@repo/design-system/lib/colors";
import { handleError } from "@repo/design-system/lib/handle-error";
import { useId, useReducer } from "react";
import { createStatus } from "@/actions/feature-status/create";
import { FeatureStatusColorPicker } from "./feature-status-color-picker";

type CreateStatusState = {
  color: string;
  complete: boolean;
  loading: boolean;
  name: string;
  open: boolean;
};

type CreateStatusAction =
  | { type: "reset" }
  | { type: "set-color"; value: string }
  | { type: "set-complete"; value: boolean }
  | { type: "set-loading"; value: boolean }
  | { type: "set-name"; value: string }
  | { type: "set-open"; value: boolean };

const initialState: CreateStatusState = {
  color: colors.gray,
  complete: false,
  loading: false,
  name: "",
  open: false,
};

const createStatusReducer = (
  state: CreateStatusState,
  action: CreateStatusAction
): CreateStatusState => {
  switch (action.type) {
    case "reset":
      return initialState;
    case "set-color":
      return { ...state, color: action.value };
    case "set-complete":
      return { ...state, complete: action.value };
    case "set-loading":
      return { ...state, loading: action.value };
    case "set-name":
      return { ...state, name: action.value };
    case "set-open":
      return { ...state, open: action.value };
    default:
      return state;
  }
};

export const CreateStatusButton = () => {
  const _id = useId();
  const [state, dispatch] = useReducer(createStatusReducer, initialState);
  const { color, complete, loading, name, open } = state;

  const handleSave = async () => {
    if (loading) {
      return;
    }

    dispatch({ type: "set-loading", value: true });

    try {
      const { error } = await createStatus(name, color, complete);

      if (error) {
        throw new Error(error);
      }

      dispatch({ type: "reset" });

      window.location.reload();
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: "set-loading", value: false });
    }
  };

  return (
    <Dialog
      cta="Create status"
      description="A status is a way to categorize your features. For example, you can use statuses to indicate whether a feature is in development, in review, or launched."
      disabled={loading}
      onClick={handleSave}
      onOpenChange={(nextOpen) =>
        dispatch({ type: "set-open", value: nextOpen })
      }
      open={open}
      title="Create a new status"
      trigger={<Button variant="outline">Create status</Button>}
    >
      <div className="my-4 space-y-2">
        <Input
          autoComplete="off"
          label="Name"
          maxLength={191}
          onChangeText={(value) => dispatch({ type: "set-name", value })}
          placeholder="In development"
          required
          value={name}
        />
        <div className="space-y-1.5">
          <Label htmlFor="color">Color</Label>
          <div>
            <FeatureStatusColorPicker
              onChange={(value) => dispatch({ type: "set-color", value })}
              value={color}
            />
          </div>
        </div>
        <Switch
          checked={complete}
          description="Features with this status are considered complete"
          label="Complete"
          onCheckedChange={(value) => dispatch({ type: "set-complete", value })}
        />
      </div>
    </Dialog>
  );
};
