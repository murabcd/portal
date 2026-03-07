import { currentOrganizationId } from "@repo/backend/auth/utils";
import { tables } from "@repo/backend/database";
import { Link } from "@repo/design-system/components/link";
import { StackCard } from "@repo/design-system/components/stack-card";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { createMetadata } from "@repo/lib/metadata";
import { count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import { database } from "@/lib/database";

const title = "Integrations";
const description = "Connect your favorite tools to Portal.";

export const metadata: Metadata = createMetadata({
  title,
  description,
});

const IntegrationsSettings = async () => {
  const organizationId = await currentOrganizationId();

  if (!organizationId) {
    return <div />;
  }

  const jiraInstallation = await database
    .select({ count: count() })
    .from(tables.atlassianInstallation)
    .where(eq(tables.atlassianInstallation.organizationId, organizationId))
    .then((rows) => rows[0]?.count ?? 0);

  const integrations = [
    {
      title: "Jira",
      description: "Two-way sync your Jira issues with Portal features.",
      icon: "/jira.svg",
      installed: Boolean(jiraInstallation),
      installLink: "/settings/integrations/jira",
      configureLink: "/settings/integrations/jira",
    },

    {
      title: "Portal API",
      description: "Interface directly with Portal",
      icon: "/portal.svg",
      installed: true,
      installLink: "/settings/api",
      configureLink: "/settings/api",
    },
    {
      title: "Email",
      invert: true,
      description: "Send feedback via email",
      icon: "/email.svg",
      installed: true,
      installLink: "/settings/integrations/email",
      configureLink: "/settings/integrations/email",
    },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="m-0 font-semibold text-4xl tracking-tight">{title}</h1>
        <p className="mb-0 text-muted-foreground">{description}</p>
      </div>

      <StackCard className="divide-y p-0">
        {integrations.map((integration) => (
          <div className="flex items-center gap-4 p-4" key={integration.title}>
            <Image
              alt={integration.title}
              className="m-0 h-8 w-8 shrink-0 object-contain"
              height={32}
              src={integration.icon}
              width={32}
            />
            <div className="block flex-1">
              <div className="flex items-center gap-1.5">
                <div className="block font-medium">{integration.title}</div>
                {integration.installed ? (
                  <Badge variant="secondary">Installed</Badge>
                ) : null}
              </div>
              <div className="block text-muted-foreground text-sm">
                {integration.description}
              </div>
            </div>
            {integration.installed ? (
              <Button
                asChild
                className="flex items-center gap-2"
                variant="outline"
              >
                <Link href={integration.configureLink}>Configure</Link>
              </Button>
            ) : (
              <Button
                asChild
                className="flex items-center gap-2"
                variant="outline"
              >
                <Link href={integration.installLink}>Install</Link>
              </Button>
            )}
          </div>
        ))}
      </StackCard>
    </div>
  );
};

export default IntegrationsSettings;
