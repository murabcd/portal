import { useDroppable } from "@dnd-kit/core";
import { FlowniRole } from "@repo/backend/auth";
import { Emoji } from "@repo/design-system/components/emoji";
import { EmojiSelector } from "@repo/design-system/components/emoji-selector";
import { Link } from "@repo/design-system/components/link";
import { LoadingCircle } from "@repo/design-system/components/loading-circle";
import { AlertDialog } from "@repo/design-system/components/precomposed/alert-dialog";
import { Dialog } from "@repo/design-system/components/precomposed/dialog";
import { DropdownMenu } from "@repo/design-system/components/precomposed/dropdown-menu";
import { Input } from "@repo/design-system/components/precomposed/input";
import { Button } from "@repo/design-system/components/ui/button";
import { handleError } from "@repo/design-system/lib/handle-error";
import { cn } from "@repo/design-system/lib/utils";
import { ChevronDown, MoreHorizontalIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useReducer } from "react";
import { useFeatureForm } from "@/components/feature-form/use-feature-form";

type ProductsListItemProperties = {
  readonly id: string;
  readonly active?: boolean;
  readonly emoji: string;
  readonly name: string;
  readonly href: string;
  readonly hasChildren?: boolean;
  readonly onEmojiSelect?: (emoji: string) => Promise<void>;
  readonly onRename?: (name: string) => Promise<void>;
  readonly onDelete?: () => Promise<void>;
  readonly createProps?: {
    readonly productId?: string;
    readonly groupId?: string;
  };
  readonly children?: ReactNode;
  readonly className?: string;
  readonly role?: string;
};

const createEmojiSelectHandler =
  ({
    emojiLoading,
    loading,
    setEmojiLoading,
    setLoading,
    onEmojiSelect,
  }: {
    emojiLoading: boolean;
    loading: boolean;
    setEmojiLoading: (value: boolean) => void;
    setLoading: (value: boolean) => void;
    onEmojiSelect?: (emoji: string) => Promise<void>;
  }) =>
  async (newEmoji: string) => {
    if (emojiLoading || loading) {
      return;
    }

    setEmojiLoading(true);
    setLoading(true);

    try {
      await onEmojiSelect?.(newEmoji);
    } catch (error) {
      handleError(error);
    } finally {
      setEmojiLoading(false);
      setLoading(false);
    }
  };

const createRenameHandler =
  ({
    loading,
    newName,
    onRename,
    setLoading,
    setShowRenameDialog,
  }: {
    loading: boolean;
    newName: string;
    onRename?: (name: string) => Promise<void>;
    setLoading: (value: boolean) => void;
    setShowRenameDialog: (value: boolean) => void;
  }) =>
  async () => {
    if (loading) {
      return;
    }

    setShowRenameDialog(false);

    try {
      await onRename?.(newName);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

const createDeleteHandler =
  ({
    loading,
    onDelete,
    setLoading,
    setShowDeleteDialog,
  }: {
    loading: boolean;
    onDelete?: () => Promise<void>;
    setLoading: (value: boolean) => void;
    setShowDeleteDialog: (value: boolean) => void;
  }) =>
  async () => {
    if (loading) {
      return;
    }

    setShowDeleteDialog(false);

    try {
      await onDelete?.();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

type FeatureFormApi = {
  show: (properties?: { groupId?: string; productId?: string }) => void;
};

type ProductsListItemState = {
  childrenOpen: boolean;
  emojiLoading: boolean;
  loading: boolean;
  newName: string;
  showDeleteDialog: boolean;
  showRenameDialog: boolean;
};

type ProductsListItemAction =
  | { type: "set-children-open"; value: boolean }
  | { type: "set-emoji-loading"; value: boolean }
  | { type: "set-loading"; value: boolean }
  | { type: "set-new-name"; value: string }
  | { type: "set-show-delete-dialog"; value: boolean }
  | { type: "set-show-rename-dialog"; value: boolean };

const createInitialState = (name: string): ProductsListItemState => ({
  childrenOpen: false,
  emojiLoading: false,
  loading: false,
  newName: name,
  showDeleteDialog: false,
  showRenameDialog: false,
});

const productsListItemReducer = (
  state: ProductsListItemState,
  action: ProductsListItemAction
): ProductsListItemState => {
  switch (action.type) {
    case "set-children-open":
      return { ...state, childrenOpen: action.value };
    case "set-emoji-loading":
      return { ...state, emojiLoading: action.value };
    case "set-loading":
      return { ...state, loading: action.value };
    case "set-new-name":
      return { ...state, newName: action.value };
    case "set-show-delete-dialog":
      return { ...state, showDeleteDialog: action.value };
    case "set-show-rename-dialog":
      return { ...state, showRenameDialog: action.value };
    default:
      return state;
  }
};

const createFeatureHandler =
  (
    featureForm: FeatureFormApi,
    createProps: ProductsListItemProperties["createProps"]
  ) =>
  () => {
    setTimeout(() => {
      featureForm.show(createProps);
    }, 250);
  };

const ProductsListItemRow = ({
  emoji,
  emojiLoading,
  name,
  href,
  role,
  className,
  hasChildren,
  isActive,
  setNodeRef,
  childrenOpen,
  setChildrenOpen,
  canManage,
  handleEmojiSelect,
  handleCreateFeature,
  setShowRenameDialog,
  setShowDeleteDialog,
  children,
}: {
  emoji: string;
  emojiLoading: boolean;
  name: string;
  href: string;
  role?: string;
  className?: string;
  hasChildren?: boolean;
  isActive: boolean;
  setNodeRef: (node: HTMLElement | null) => void;
  childrenOpen: boolean;
  setChildrenOpen: (open: boolean) => void;
  canManage: boolean;
  handleEmojiSelect: (emoji: string) => void;
  handleCreateFeature: () => void;
  setShowRenameDialog: (open: boolean) => void;
  setShowDeleteDialog: (open: boolean) => void;
  children?: ReactNode;
}) => (
  <>
    <div
      className={cn(
        "group flex items-center gap-2 transition-colors",
        className,
        isActive
          ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
          : ""
      )}
      ref={setNodeRef}
    >
      <div className="p-3 pr-0">
        {emojiLoading ? (
          <LoadingCircle />
        ) : (
          <div>
            {role === FlowniRole.Member ? (
              <div className="flex h-4 w-4 items-center justify-center">
                <p className="text-sm">
                  <Emoji id={emoji} size="0.825rem" />
                </p>
              </div>
            ) : (
              <EmojiSelector
                onChange={handleEmojiSelect}
                onError={handleError}
                value={emoji}
              />
            )}
          </div>
        )}
      </div>
      <Link
        className="flex-1 truncate py-3 text-sm transition-colors"
        href={href}
      >
        {name}
      </Link>
      <div className="-my-2 flex shrink-0 gap-px pr-1">
        {canManage ? (
          <DropdownMenu
            data={[
              { onClick: handleCreateFeature, children: "Create Feature" },
              {
                onClick: () => setShowRenameDialog(true),
                children: "Rename",
              },
              {
                onClick: () => setShowDeleteDialog(true),
                children: "Delete",
              },
            ]}
          >
            <Button size="icon" variant="ghost">
              <MoreHorizontalIcon
                className={cn(
                  isActive
                    ? "text-violet-700 dark:text-violet-300"
                    : "text-muted-foreground"
                )}
                size={16}
              />
            </Button>
          </DropdownMenu>
        ) : null}
        {hasChildren ? (
          <Button
            onClick={() => setChildrenOpen(!childrenOpen)}
            size="icon"
            variant="ghost"
          >
            <ChevronDown
              className={cn(
                "transition-transform",
                isActive
                  ? "text-violet-700 dark:text-violet-300"
                  : "text-muted-foreground",
                childrenOpen ? "rotate-180" : ""
              )}
              size={16}
            />
          </Button>
        ) : null}
      </div>
    </div>
    {childrenOpen ? <div>{children}</div> : null}
  </>
);

export const ProductsListItem = ({
  id,
  active,
  emoji,
  name,
  href,
  onEmojiSelect,
  onRename,
  onDelete,
  createProps,
  children,
  className,
  hasChildren,
  role,
}: ProductsListItemProperties) => {
  const featureForm = useFeatureForm();
  const [state, dispatch] = useReducer(
    productsListItemReducer,
    name,
    createInitialState
  );
  const {
    childrenOpen,
    emojiLoading,
    loading,
    newName,
    showDeleteDialog,
    showRenameDialog,
  } = state;
  const { isOver, setNodeRef } = useDroppable({ id });

  const handleEmojiSelect = createEmojiSelectHandler({
    emojiLoading,
    loading,
    setEmojiLoading: (value) => dispatch({ type: "set-emoji-loading", value }),
    setLoading: (value) => dispatch({ type: "set-loading", value }),
    onEmojiSelect,
  });
  const handleRename = createRenameHandler({
    loading,
    newName,
    onRename,
    setLoading: (value) => dispatch({ type: "set-loading", value }),
    setShowRenameDialog: (value) =>
      dispatch({ type: "set-show-rename-dialog", value }),
  });
  const handleDelete = createDeleteHandler({
    loading,
    onDelete,
    setLoading: (value) => dispatch({ type: "set-loading", value }),
    setShowDeleteDialog: (value) =>
      dispatch({ type: "set-show-delete-dialog", value }),
  });
  const handleCreateFeature = createFeatureHandler(featureForm, createProps);
  const isActive = active ?? isOver;
  const canManage = Boolean(onRename && onDelete) && role !== FlowniRole.Member;

  return (
    <>
      <ProductsListItemRow
        canManage={canManage}
        childrenOpen={childrenOpen}
        className={className}
        emoji={emoji}
        emojiLoading={emojiLoading}
        handleCreateFeature={handleCreateFeature}
        handleEmojiSelect={handleEmojiSelect}
        hasChildren={hasChildren}
        href={href}
        isActive={isActive}
        name={name}
        role={role}
        setChildrenOpen={(value) =>
          dispatch({ type: "set-children-open", value })
        }
        setNodeRef={setNodeRef}
        setShowDeleteDialog={(value) =>
          dispatch({ type: "set-show-delete-dialog", value })
        }
        setShowRenameDialog={(value) =>
          dispatch({ type: "set-show-rename-dialog", value })
        }
      >
        {children}
      </ProductsListItemRow>
      <Dialog
        cta="Save"
        description={`Enter a new name for ${name} below.`}
        disabled={loading}
        onClick={handleRename}
        onOpenChange={(value) =>
          dispatch({ type: "set-show-rename-dialog", value })
        }
        open={showRenameDialog}
        title={`Rename ${name}`}
      >
        <Input
          autoComplete="off"
          maxLength={191}
          onChangeText={(value) => dispatch({ type: "set-new-name", value })}
          value={newName}
        />
      </Dialog>
      <AlertDialog
        description={`This will permanently delete ${name}. This action cannot be undone.`}
        disabled={loading}
        onClick={handleDelete}
        onOpenChange={(value) =>
          dispatch({ type: "set-show-delete-dialog", value })
        }
        open={showDeleteDialog}
        title="Are you absolutely sure?"
      />
    </>
  );
};
