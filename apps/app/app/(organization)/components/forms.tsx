import { PortalRole } from "@repo/backend/auth";
import {
  currentMembers,
  currentOrganizationId,
  currentUser,
} from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { asc, eq } from "drizzle-orm";
import { ChangelogForm } from "@/components/changelog-form";
import { CommandBar } from "@/components/command-bar";
import { ConnectForm } from "@/components/connect-form";
import { FeatureForm } from "@/components/feature-form";
import { FeedbackForm } from "@/components/feedback-form";
import { GroupForm } from "@/components/group-form";
import { InitiativeForm } from "@/components/initiative-form";
import { ProductForm } from "@/components/product-form";
import { ReleaseForm } from "@/components/release-form";
import { database } from "@/lib/database";
import { toMemberInfoList } from "@/lib/serialization";
import { staticify } from "@/lib/staticify";

export const Forms = async () => {
  const [user, organizationId] = await Promise.all([
    currentUser(),
    currentOrganizationId(),
  ]);

  if (!(user && organizationId)) {
    return <div />;
  }

  const [
    organization,
    feedbackUsers,
    feedbackOrganizations,
    products,
    groups,
    atlassianInstallations,
    members,
  ] = await Promise.all([
    database
      .select({ id: tables.organization.id })
      .from(tables.organization)
      .where(eq(tables.organization.id, organizationId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    database
      .select({
        id: tables.feedbackUser.id,
        feedbackOrganizationId: tables.feedbackUser.feedbackOrganizationId,
        name: tables.feedbackUser.name,
        imageUrl: tables.feedbackUser.imageUrl,
        email: tables.feedbackUser.email,
      })
      .from(tables.feedbackUser)
      .where(eq(tables.feedbackUser.organizationId, organizationId))
      .orderBy(asc(tables.feedbackUser.name)),
    database
      .select({
        id: tables.feedbackOrganization.id,
        name: tables.feedbackOrganization.name,
        domain: tables.feedbackOrganization.domain,
      })
      .from(tables.feedbackOrganization)
      .where(eq(tables.feedbackOrganization.organizationId, organizationId))
      .orderBy(asc(tables.feedbackOrganization.name)),
    database
      .select({
        id: tables.product.id,
        name: tables.product.name,
        emoji: tables.product.emoji,
      })
      .from(tables.product)
      .where(eq(tables.product.organizationId, organizationId))
      .orderBy(asc(tables.product.name)),
    database
      .select({
        id: tables.group.id,
        name: tables.group.name,
        productId: tables.group.productId,
        parentGroupId: tables.group.parentGroupId,
        emoji: tables.group.emoji,
      })
      .from(tables.group)
      .where(eq(tables.group.organizationId, organizationId))
      .orderBy(asc(tables.group.name)),
    database
      .select({ accessToken: tables.atlassianInstallation.accessToken })
      .from(tables.atlassianInstallation)
      .where(eq(tables.atlassianInstallation.organizationId, organizationId))
      .limit(1),
    currentMembers(),
  ]);
  const membersLite = toMemberInfoList(members);

  if (!organization) {
    return <div />;
  }

  return (
    <>
      <FeedbackForm
        organizations={feedbackOrganizations}
        userEmail={user.email ?? undefined}
        users={feedbackUsers}
      />
      {user.organizationRole !== PortalRole.Member && (
        <>
          <FeatureForm
            groups={groups}
            members={staticify(membersLite)}
            products={products}
            userId={user.id}
          />
          <ProductForm />
          <GroupForm groups={groups} products={products} />
          <InitiativeForm members={staticify(membersLite)} userId={user.id} />
          <ConnectForm
            jiraAccessToken={atlassianInstallations.at(0)?.accessToken}
          />
          <ChangelogForm />
          <ReleaseForm />
          <CommandBar hasProducts={products.length > 0} />
        </>
      )}
    </>
  );
};
