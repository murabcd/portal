import { ClockIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

const Changelog = async () => (
  <div className="flex flex-1 items-center justify-center">
    <EmptyState
      description="Select an update from the sidebar to view or edit its contents."
      icon={ClockIcon}
      title="Choose an update"
    />
  </div>
);

export default Changelog;
