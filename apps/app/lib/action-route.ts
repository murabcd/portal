type ActionRequest = {
  readonly action: string;
  readonly args: unknown[];
};

export const parseActionRequest = async (
  request: Request
): Promise<ActionRequest> => {
  const body = (await request.json().catch(() => null)) as {
    readonly action?: unknown;
    readonly args?: unknown;
  } | null;

  if (!body || typeof body.action !== "string" || body.action.length === 0) {
    throw new Error("Invalid action name");
  }

  if (body.args !== undefined && !Array.isArray(body.args)) {
    throw new Error("Invalid action arguments");
  }

  return {
    action: body.action,
    args: body.args ?? [],
  };
};
