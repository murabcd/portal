"use client";

import { PortalRole } from "@repo/backend/auth";
import { Dialog } from "@repo/design-system/components/precomposed/dialog";
import { handleError } from "@repo/design-system/lib/handle-error";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { ChangelogForm } from "@/components/changelog-form";
import { CommandBar } from "@/components/command-bar";
import { ConnectForm } from "@/components/connect-form";
import { useConnectForm } from "@/components/connect-form/use-connect-form";
import { FeatureForm } from "@/components/feature-form";
import { useFeatureForm } from "@/components/feature-form/use-feature-form";
import { FeedbackForm } from "@/components/feedback-form";
import { useFeedbackForm } from "@/components/feedback-form/use-feedback-form";
import { GroupForm } from "@/components/group-form";
import { useGroupForm } from "@/components/group-form/use-group-form";
import { InitiativeForm } from "@/components/initiative-form";
import { useInitiativeForm } from "@/components/initiative-form/use-initiative-form";
import { ProductForm } from "@/components/product-form";
import { ReleaseForm } from "@/components/release-form";
import { fetcher } from "@/lib/fetcher";
import type { MemberInfo } from "@/lib/serialization";

type FormsProperties = {
  readonly organizationRole: PortalRole;
  readonly userEmail: string | undefined;
  readonly userId: string;
};

type FeedbackFormData = {
  readonly organizations: {
    readonly domain: string | null;
    readonly id: string;
    readonly name: string;
  }[];
  readonly users: {
    readonly email: string | null;
    readonly feedbackOrganizationId: string | null;
    readonly id: string;
    readonly imageUrl: string | null;
    readonly name: string;
  }[];
};

type AdminFormsData = {
  readonly groups: {
    readonly emoji: string;
    readonly id: string;
    readonly name: string;
    readonly parentGroupId: string | null;
    readonly productId: string | null;
  }[];
  readonly hasProducts: boolean;
  readonly jiraAccessToken: string | undefined;
  readonly members: MemberInfo[];
  readonly products: {
    readonly emoji: string;
    readonly id: string;
    readonly name: string;
  }[];
};

type AdminMeta = {
  readonly hasProducts: boolean;
};

const useLoadOnOpen = (isOpen: boolean) => {
  const [shouldLoad, setShouldLoad] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldLoad(true);
    }
  }, [isOpen]);

  return shouldLoad;
};

const LoadingDialog = ({
  description,
  onOpenChange,
  open,
  title,
}: {
  readonly description: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly open: boolean;
  readonly title: string;
}) => (
  <Dialog
    description={description}
    disabled
    modal={false}
    onOpenChange={onOpenChange}
    open={open}
    title={title}
  >
    <p className="py-4 text-muted-foreground text-sm">Loading…</p>
  </Dialog>
);

const LazyFeedbackForm = ({
  userEmail,
}: {
  readonly userEmail: string | undefined;
}) => {
  const { hide, isOpen } = useFeedbackForm();
  const shouldLoad = useLoadOnOpen(isOpen);
  const { data, isLoading } = useSWR<FeedbackFormData>(
    shouldLoad ? "/api/forms/feedback" : null,
    fetcher,
    {
      keepPreviousData: true,
      onError: handleError,
      revalidateOnFocus: false,
    }
  );

  if (isOpen && (!data || isLoading)) {
    return (
      <LoadingDialog
        description="Loading people and companies for feedback."
        onOpenChange={(open) => {
          if (!open) {
            hide();
          }
        }}
        open={isOpen}
        title="Create feedback"
      />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <FeedbackForm
      organizations={data.organizations.map((organization) => ({
        ...organization,
        domain: organization.domain ?? "",
      }))}
      userEmail={userEmail}
      users={data.users.map((user) => ({
        ...user,
        email: user.email ?? "",
        imageUrl: user.imageUrl ?? "",
      }))}
    />
  );
};

const useAdminFormsData = (enabled: boolean) =>
  useSWR<AdminFormsData>(enabled ? "/api/forms/admin" : null, fetcher, {
    keepPreviousData: true,
    onError: handleError,
    revalidateOnFocus: false,
  });

const LazyFeatureForm = ({ userId }: { readonly userId: string }) => {
  const { hide, isOpen } = useFeatureForm();
  const shouldLoad = useLoadOnOpen(isOpen);
  const { data, isLoading } = useAdminFormsData(shouldLoad);

  if (isOpen && (!data || isLoading)) {
    return (
      <LoadingDialog
        description="Loading products, groups, and teammates."
        onOpenChange={(open) => {
          if (!open) {
            hide();
          }
        }}
        open={isOpen}
        title="Create feature"
      />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <FeatureForm
      groups={data.groups}
      members={data.members}
      products={data.products}
      userId={userId}
    />
  );
};

const LazyGroupForm = () => {
  const { hide, isOpen } = useGroupForm();
  const shouldLoad = useLoadOnOpen(isOpen);
  const { data, isLoading } = useAdminFormsData(shouldLoad);

  if (isOpen && (!data || isLoading)) {
    return (
      <LoadingDialog
        description="Loading products and groups."
        onOpenChange={(open) => {
          if (!open) {
            hide();
          }
        }}
        open={isOpen}
        title="Create group"
      />
    );
  }

  if (!data) {
    return null;
  }

  return <GroupForm groups={data.groups} products={data.products} />;
};

const LazyInitiativeForm = ({ userId }: { readonly userId: string }) => {
  const { hide, isOpen } = useInitiativeForm();
  const shouldLoad = useLoadOnOpen(isOpen);
  const { data, isLoading } = useAdminFormsData(shouldLoad);

  if (isOpen && (!data || isLoading)) {
    return (
      <LoadingDialog
        description="Loading teammates for initiative ownership."
        onOpenChange={(open) => {
          if (!open) {
            hide();
          }
        }}
        open={isOpen}
        title="Create initiative"
      />
    );
  }

  if (!data) {
    return null;
  }

  return <InitiativeForm members={data.members} userId={userId} />;
};

const LazyConnectForm = () => {
  const { hide, isOpen } = useConnectForm();
  const shouldLoad = useLoadOnOpen(isOpen);
  const { data, isLoading } = useAdminFormsData(shouldLoad);

  if (isOpen && (!data || isLoading)) {
    return (
      <LoadingDialog
        description="Loading integration details."
        onOpenChange={(open) => {
          if (!open) {
            hide();
          }
        }}
        open={isOpen}
        title="Connect feature"
      />
    );
  }

  if (!data) {
    return null;
  }

  return <ConnectForm jiraAccessToken={data.jiraAccessToken} />;
};

const CommandBarLoader = () => {
  const { data } = useSWR<AdminMeta>("/api/forms/admin-meta", fetcher, {
    onError: handleError,
    revalidateOnFocus: false,
  });

  return <CommandBar hasProducts={data?.hasProducts ?? false} />;
};

export const Forms = ({
  organizationRole,
  userEmail,
  userId,
}: FormsProperties) => {
  const isAdmin = organizationRole !== PortalRole.Member;

  return (
    <>
      <LazyFeedbackForm userEmail={userEmail} />
      {isAdmin ? (
        <>
          <LazyFeatureForm userId={userId} />
          <ProductForm />
          <LazyGroupForm />
          <LazyInitiativeForm userId={userId} />
          <LazyConnectForm />
          <ChangelogForm />
          <ReleaseForm />
          <CommandBarLoader />
        </>
      ) : null}
    </>
  );
};
