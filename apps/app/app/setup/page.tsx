import { currentOrganizationId } from "@repo/backend/auth/utils";
import { createMetadata } from "@repo/lib/metadata";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreateOrganizationForm } from "./components/form";
import { SignOutButton } from "./components/sign-out-button";

const title = "Create Organization";
const description = "Create an organization to get started.";

export const metadata: Metadata = createMetadata({ title, description });

const SetupPage = async () => {
  const organizationId = await currentOrganizationId();

  if (organizationId) {
    redirect("/");
  }

  return (
    <div className="grid min-h-screen w-screen items-center justify-center px-4 py-16">
      <div className="fixed top-4 right-4">
        <SignOutButton />
      </div>
      <div className="w-full max-w-[400px] space-y-8">
        <CreateOrganizationForm />
        <p className="text-center text-muted-foreground text-sm">
          Is your organization already using Portal? Sign in with the same
          GitHub account to join.
        </p>
      </div>
    </div>
  );
};

export default SetupPage;
