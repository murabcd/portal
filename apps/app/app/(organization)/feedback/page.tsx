import { createMetadata } from "@repo/lib/metadata";
import { MessageCircleIcon } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = createMetadata({
  title: "Feedback",
  description: "View and manage feedback.",
});

const FeedbackIndexPage = async () => {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        description="Select feedback from the sidebar to review details and triage it."
        icon={MessageCircleIcon}
        title="Choose feedback"
      />
    </div>
  );
};

export default FeedbackIndexPage;
