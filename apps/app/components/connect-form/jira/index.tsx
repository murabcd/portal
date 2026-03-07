import type { tables } from "@repo/backend/database";
import { Button } from "@repo/design-system/components/ui/button";
import Link from "next/link";
import { OrDivider } from "@/components/or-divider";
import { JiraIssueCreator } from "./jira-issue-creator";
import { JiraIssuePicker } from "./jira-issue-picker";

type JiraSelectorProperties = {
  readonly jiraAccessToken:
    | (typeof tables.atlassianInstallation.$inferSelect)["accessToken"]
    | undefined;
};

export const JiraSelector = ({ jiraAccessToken }: JiraSelectorProperties) => {
  if (!jiraAccessToken) {
    return (
      <Button asChild>
        <Link
          href="/settings/integrations/jira"
          rel="noopener noreferrer"
          target="_blank"
        >
          Install Jira app
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <JiraIssuePicker />
      <OrDivider />
      <JiraIssueCreator />
    </div>
  );
};
