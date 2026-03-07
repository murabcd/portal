import { currentMembers } from "@repo/backend/auth/utils";
import { createMetadata } from "@repo/lib/metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { toMemberInfoList } from "@/lib/serialization";
import { ActivityFeed } from "./components/activity-feed";

const title = "Activity";
const description = "View the latest activity in your organization.";

export const metadata: Metadata = createMetadata({
  title,
  description,
});

const ActivityContent = async () => {
  const members = await currentMembers();
  const membersLite = toMemberInfoList(members);

  return <ActivityFeed members={membersLite} />;
};

const Activity = () => (
  <div className="mx-auto grid w-full max-w-3xl gap-6 p-6 py-16">
    <div className="grid gap-2">
      <h1 className="m-0 font-semibold text-4xl tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
    <Suspense fallback={null}>
      <ActivityContent />
    </Suspense>
  </div>
);

export default Activity;
