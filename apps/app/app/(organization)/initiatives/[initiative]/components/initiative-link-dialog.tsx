"use client";

import type {
  Feature,
  FeatureStatus,
  Group,
  Product,
} from "@repo/backend/types";
import { Emoji } from "@repo/design-system/components/emoji";
import { Dialog } from "@repo/design-system/components/precomposed/dialog";
import { DropdownMenu } from "@repo/design-system/components/precomposed/dropdown-menu";
import { Select } from "@repo/design-system/components/precomposed/select";
import { Tooltip } from "@repo/design-system/components/precomposed/tooltip";
import { Button } from "@repo/design-system/components/ui/button";
import { handleError } from "@repo/design-system/lib/handle-error";
import { toast } from "@repo/design-system/lib/toast";
import { PlusIcon } from "lucide-react";
import { useReducer } from "react";
import { linkInitiativeFeature } from "../actions/link-initiative-feature";
import { linkInitiativeGroup } from "../actions/link-initiative-group";
import { linkInitiativeProduct } from "../actions/link-initiative-product";

type InitiativeLinkDialogProps = {
  initiativeId: string;
  features: (Pick<Feature, "id" | "title"> & {
    status: Pick<FeatureStatus, "color">;
  })[];
  groups: Pick<Group, "id" | "name" | "emoji">[];
  products: Pick<Product, "id" | "name" | "emoji">[];
};

type InitiativeLinkDialogState = {
  loading: boolean;
  selectedFeature: string | undefined;
  selectedGroup: string | undefined;
  selectedProduct: string | undefined;
  showFeatureDialog: boolean;
  showGroupDialog: boolean;
  showProductDialog: boolean;
};

type InitiativeLinkDialogAction =
  | { type: "set-loading"; value: boolean }
  | { type: "set-selected-feature"; value: string | undefined }
  | { type: "set-selected-group"; value: string | undefined }
  | { type: "set-selected-product"; value: string | undefined }
  | { type: "set-show-feature-dialog"; value: boolean }
  | { type: "set-show-group-dialog"; value: boolean }
  | { type: "set-show-product-dialog"; value: boolean };

const initialState: InitiativeLinkDialogState = {
  loading: false,
  selectedFeature: undefined,
  selectedGroup: undefined,
  selectedProduct: undefined,
  showFeatureDialog: false,
  showGroupDialog: false,
  showProductDialog: false,
};

const initiativeLinkDialogReducer = (
  state: InitiativeLinkDialogState,
  action: InitiativeLinkDialogAction
): InitiativeLinkDialogState => {
  switch (action.type) {
    case "set-loading":
      return { ...state, loading: action.value };
    case "set-selected-feature":
      return { ...state, selectedFeature: action.value };
    case "set-selected-group":
      return { ...state, selectedGroup: action.value };
    case "set-selected-product":
      return { ...state, selectedProduct: action.value };
    case "set-show-feature-dialog":
      return { ...state, showFeatureDialog: action.value };
    case "set-show-group-dialog":
      return { ...state, showGroupDialog: action.value };
    case "set-show-product-dialog":
      return { ...state, showProductDialog: action.value };
    default:
      return state;
  }
};

export const InitiativeLinkDialog = ({
  initiativeId,
  features,
  groups,
  products,
}: InitiativeLinkDialogProps) => {
  const [state, dispatch] = useReducer(
    initiativeLinkDialogReducer,
    initialState
  );
  const {
    loading,
    selectedFeature,
    selectedGroup,
    selectedProduct,
    showFeatureDialog,
    showGroupDialog,
    showProductDialog,
  } = state;

  const handleLinkFeature = async () => {
    if (!selectedFeature || loading) {
      return;
    }

    dispatch({ type: "set-loading", value: true });

    try {
      const response = await linkInitiativeFeature(
        initiativeId,
        selectedFeature
      );

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Feature linked successfully");
      dispatch({ type: "set-show-feature-dialog", value: false });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: "set-loading", value: false });
    }
  };

  const handleLinkGroup = async () => {
    if (!selectedGroup || loading) {
      return;
    }

    dispatch({ type: "set-loading", value: true });

    try {
      const response = await linkInitiativeGroup(initiativeId, selectedGroup);

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Group linked successfully");
      dispatch({ type: "set-show-group-dialog", value: false });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: "set-loading", value: false });
    }
  };

  const handleLinkProduct = async () => {
    if (!selectedProduct || loading) {
      return;
    }

    dispatch({ type: "set-loading", value: true });

    try {
      const response = await linkInitiativeProduct(
        initiativeId,
        selectedProduct
      );

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Product linked successfully");
      dispatch({ type: "set-show-product-dialog", value: false });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: "set-loading", value: false });
    }
  };

  const handleShowFeatureDialog = () =>
    setTimeout(
      () => dispatch({ type: "set-show-feature-dialog", value: true }),
      200
    );

  const handleShowGroupDialog = () =>
    setTimeout(
      () => dispatch({ type: "set-show-group-dialog", value: true }),
      200
    );

  const handleShowProductDialog = () =>
    setTimeout(
      () => dispatch({ type: "set-show-product-dialog", value: true }),
      200
    );

  return (
    <>
      <DropdownMenu
        data={[
          { children: "Feature", onClick: handleShowFeatureDialog },
          { children: "Group", onClick: handleShowGroupDialog },
          { children: "Product", onClick: handleShowProductDialog },
        ]}
      >
        <Tooltip content="Link a new...">
          <Button className="-m-1.5 h-6 w-6" size="icon" variant="ghost">
            <PlusIcon size={16} />
            <span className="sr-only">Add a new contributor</span>
          </Button>
        </Tooltip>
      </DropdownMenu>

      <Dialog
        description="Link a new feature to this initiative."
        footer={
          <Button
            disabled={loading || !selectedFeature}
            onClick={handleLinkFeature}
          >
            Link Feature
          </Button>
        }
        modal={false}
        onOpenChange={(value) =>
          dispatch({ type: "set-show-feature-dialog", value })
        }
        open={showFeatureDialog}
        title="Link a Feature"
      >
        <Select
          data={features.map((feature) => ({
            value: feature.id,
            label: feature.title,
          }))}
          onChange={(value) =>
            dispatch({ type: "set-selected-feature", value })
          }
          renderItem={(item) => {
            const status = features.find(
              (feature) => feature.id === item.value
            )?.status;

            if (!status) {
              return null;
            }

            return (
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: status.color }}
                />
                <span className="flex-1 truncate">{item.label}</span>
              </div>
            );
          }}
          type="feature"
          value={selectedFeature}
        />
      </Dialog>

      <Dialog
        description="Link a new group to this initiative."
        footer={
          <Button
            disabled={loading || !selectedGroup}
            onClick={handleLinkGroup}
          >
            Link Group
          </Button>
        }
        modal={false}
        onOpenChange={(value) =>
          dispatch({ type: "set-show-group-dialog", value })
        }
        open={showGroupDialog}
        title="Link a Group"
      >
        <Select
          data={groups.map((group) => ({
            value: group.id,
            label: group.name,
          }))}
          onChange={(value) => dispatch({ type: "set-selected-group", value })}
          renderItem={(item) => {
            const selectedGroupItem = groups.find(
              (group) => group.id === item.value
            );

            if (!selectedGroupItem) {
              return null;
            }

            return (
              <div className="flex items-center gap-2">
                <Emoji id={selectedGroupItem.emoji} size="0.825rem" />
                <span className="flex-1 truncate">{item.label}</span>
              </div>
            );
          }}
          type="group"
          value={selectedGroup}
        />
      </Dialog>

      <Dialog
        description="Link a new product to this initiative."
        footer={
          <Button
            disabled={loading || !selectedProduct}
            onClick={handleLinkProduct}
          >
            Link Product
          </Button>
        }
        modal={false}
        onOpenChange={(value) =>
          dispatch({ type: "set-show-product-dialog", value })
        }
        open={showProductDialog}
        title="Link a Product"
      >
        <Select
          data={products.map((product) => ({
            value: product.id,
            label: product.name,
          }))}
          onChange={(value) =>
            dispatch({ type: "set-selected-product", value })
          }
          renderItem={(item) => {
            const selectedProductItem = products.find(
              (product) => product.id === item.value
            );

            if (!selectedProductItem) {
              return null;
            }

            return (
              <div className="flex items-center gap-2">
                <Emoji id={selectedProductItem.emoji} size="0.825rem" />
                <span className="flex-1 truncate">{item.label}</span>
              </div>
            );
          }}
          type="product"
          value={selectedProduct}
        />
      </Dialog>
    </>
  );
};
