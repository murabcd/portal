import { BuildingIcon } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Companies",
  description: "View all companies who have provided feedback.",
});

const CompanyIndexPage = async () => {
  return (
    <EmptyState
      description="Select a company from the sidebar to view its feedback."
      icon={BuildingIcon}
      title="Choose a company"
    />
  );
};

export default CompanyIndexPage;
