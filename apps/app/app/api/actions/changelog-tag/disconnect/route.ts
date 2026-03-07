import { NextResponse } from "next/server";
import { removeChangelogTag } from "@/actions/changelog-tag/disconnect.service";
import { parseActionRequest } from "@/lib/action-route";

const handlers = {
  removeChangelogTag,
} as const;

export const POST = async (request: Request) => {
  try {
    const { action, args } = await parseActionRequest(request);
    const handler = handlers[action as keyof typeof handlers];

    if (!handler) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    const result = await (
      handler as (...parameters: unknown[]) => Promise<unknown>
    )(...args);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process action";

    return NextResponse.json({ error: message }, { status: 400 });
  }
};
