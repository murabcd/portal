"use client";

import type {
  Feedback,
  FeedbackOrganization,
  FeedbackUser,
} from "@repo/backend/types";
import { AlertDialog } from "@repo/design-system/components/precomposed/alert-dialog";
import { Dialog } from "@repo/design-system/components/precomposed/dialog";
import { DropdownMenu } from "@repo/design-system/components/precomposed/dropdown-menu";
import { Tooltip } from "@repo/design-system/components/precomposed/tooltip";
import { Button } from "@repo/design-system/components/ui/button";
import { handleError } from "@repo/design-system/lib/handle-error";
import { QueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReducer } from "react";
import { deleteFeedback } from "@/actions/feedback/delete";
import { updateFeedback } from "@/actions/feedback/update";
import { FeedbackOrganizationPicker } from "@/components/feedback-form/feedback-organization-picker";
import { FeedbackUserPicker } from "@/components/feedback-form/feedback-user-picker";

type FeedbackSettingsDropdownProperties = {
  readonly feedbackId: Feedback["id"];
  readonly defaultFeedbackUserId: string | undefined;
  readonly defaultFeedbackOrganizationId: string | undefined;
  readonly users: Pick<FeedbackUser, "email" | "id" | "imageUrl" | "name">[];
  readonly organizations: Pick<
    FeedbackOrganization,
    "domain" | "id" | "name"
  >[];
};

type FeedbackSettingsState = {
  changeUserOpen: boolean;
  deleteOpen: boolean;
  feedbackOrganizationId: string | null;
  feedbackUserId: string | null;
  loading: boolean;
};

type FeedbackSettingsAction =
  | { type: "set-change-user-open"; value: boolean }
  | { type: "set-delete-open"; value: boolean }
  | { type: "set-feedback-organization-id"; value: string | null }
  | { type: "set-feedback-user-id"; value: string | null }
  | { type: "set-loading"; value: boolean };

const createInitialState = (
  defaultFeedbackUserId: string | undefined,
  defaultFeedbackOrganizationId: string | undefined
): FeedbackSettingsState => ({
  changeUserOpen: false,
  deleteOpen: false,
  feedbackOrganizationId: defaultFeedbackOrganizationId ?? null,
  feedbackUserId: defaultFeedbackUserId ?? null,
  loading: false,
});

const feedbackSettingsReducer = (
  state: FeedbackSettingsState,
  action: FeedbackSettingsAction
): FeedbackSettingsState => {
  switch (action.type) {
    case "set-change-user-open":
      return { ...state, changeUserOpen: action.value };
    case "set-delete-open":
      return { ...state, deleteOpen: action.value };
    case "set-feedback-organization-id":
      return { ...state, feedbackOrganizationId: action.value };
    case "set-feedback-user-id":
      return { ...state, feedbackUserId: action.value };
    case "set-loading":
      return { ...state, loading: action.value };
    default:
      return state;
  }
};

export const FeedbackSettingsDropdown = ({
  feedbackId,
  defaultFeedbackUserId,
  defaultFeedbackOrganizationId,
  users,
  organizations,
}: FeedbackSettingsDropdownProperties) => {
  const [state, dispatch] = useReducer(
    feedbackSettingsReducer,
    {
      defaultFeedbackOrganizationId,
      defaultFeedbackUserId,
    },
    ({ defaultFeedbackOrganizationId, defaultFeedbackUserId }) =>
      createInitialState(defaultFeedbackUserId, defaultFeedbackOrganizationId)
  );
  const {
    changeUserOpen,
    deleteOpen,
    feedbackOrganizationId,
    feedbackUserId,
    loading,
  } = state;
  const router = useRouter();
  const queryClient = new QueryClient();

  const handleDelete = async () => {
    if (loading) {
      return;
    }

    dispatch({ type: "set-loading", value: true });

    try {
      const { error } = await deleteFeedback(feedbackId);

      if (error) {
        throw new Error(error);
      }

      await queryClient.invalidateQueries({ queryKey: ["feedback"] });

      dispatch({ type: "set-delete-open", value: false });
      router.push("/feedback");
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: "set-loading", value: false });
    }
  };

  const handleChangeUser = async () => {
    if (loading) {
      return;
    }

    dispatch({ type: "set-loading", value: true });

    try {
      const response = await updateFeedback(feedbackId, {
        feedbackUserId,
      });

      if ("error" in response) {
        throw new Error(response.error);
      }

      dispatch({ type: "set-change-user-open", value: false });
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
            onClick: () => dispatch({ type: "set-delete-open", value: true }),
            disabled: loading,
            children: "Delete",
          },
          {
            onClick: () =>
              dispatch({ type: "set-change-user-open", value: true }),
            disabled: loading,
            children: "Change user",
          },
        ]}
      >
        <Tooltip align="end" content="Settings" side="bottom">
          <Button size="icon" variant="ghost">
            <MoreHorizontalIcon size={16} />
          </Button>
        </Tooltip>
      </DropdownMenu>

      <AlertDialog
        description="This action cannot be undone. This will permanently this feedback."
        disabled={loading}
        onClick={handleDelete}
        onOpenChange={(value) => dispatch({ type: "set-delete-open", value })}
        open={deleteOpen}
        title="Are you absolutely sure?"
      />

      <Dialog
        cta="Save"
        description="Who submitted this feedback?"
        disabled={loading}
        onClick={handleChangeUser}
        onOpenChange={(value) =>
          dispatch({ type: "set-change-user-open", value })
        }
        open={changeUserOpen}
        title="Change user"
      >
        <div className="flex items-center gap-2">
          <FeedbackUserPicker
            onChange={(value) =>
              dispatch({ type: "set-feedback-user-id", value })
            }
            usersData={users.map((user) => ({
              value: user.id,
              label: user.name,
              image: user.imageUrl,
              email: user.email,
            }))}
            value={feedbackUserId}
          />
          {feedbackUserId ? (
            <FeedbackOrganizationPicker
              feedbackUser={feedbackUserId}
              onChange={(value) =>
                dispatch({ type: "set-feedback-organization-id", value })
              }
              organizationsData={organizations.map((organization) => ({
                value: organization.id,
                label: organization.name,
                image: organization.domain,
              }))}
              value={feedbackOrganizationId}
            />
          ) : null}
        </div>
      </Dialog>
    </>
  );
};
