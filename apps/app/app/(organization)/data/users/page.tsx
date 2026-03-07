import { UserCircleIcon } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Users",
  description: "View all users who have provided feedback.",
});

const UserIndexPage = async () => {
  return (
    <EmptyState
      description="Select a user from the sidebar to view their feedback."
      icon={UserCircleIcon}
      title="Choose a user"
    />
  );
};

export default UserIndexPage;
