import type { User } from "@repo/backend/auth";
import { getUserName } from "@repo/backend/auth/format";
import { currentMembers } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import { StackCard } from "@repo/design-system/components/stack-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { KeyIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { CreateAPIKeyButton } from "./create-api-key-button";
import { DeleteAPIKeyButton } from "./delete-api-key-button";

export const ApiKeysTable = async () => {
  const [keys, members] = await Promise.all([
    database
      .select({
        id: tables.apiKey.id,
        name: tables.apiKey.name,
        key: tables.apiKey.key,
        creatorId: tables.apiKey.creatorId,
      })
      .from(tables.apiKey),
    currentMembers(),
  ]);

  const getMemberName = (userId: User["id"]) => {
    const member = members.find(({ id }) => userId === id);

    return member ? getUserName(member) : "Unknown";
  };

  return (
    <StackCard
      action={<CreateAPIKeyButton />}
      className="p-0"
      icon={KeyIcon}
      title="API Keys"
    >
      {keys.length === 0 ? (
        <div className="not-prose p-8">
          <EmptyState
            compact
            description="You haven't created any API keys yet."
            title="No API keys"
          />
        </div>
      ) : (
        <Table className="mb-0">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[150px]">Key</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell className="w-[150px] font-mono">
                  {key.key.slice(0, 10)}...
                </TableCell>
                <TableCell>{getMemberName(key.creatorId)}</TableCell>
                <TableCell className="w-[100px] text-right">
                  <DeleteAPIKeyButton id={key.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </StackCard>
  );
};
