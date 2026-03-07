"use client";

import { mutate } from "swr";

type ActionPayload = {
  readonly action: string;
  readonly args: unknown[];
};

type PostActionOptions = {
  readonly revalidate?: boolean;
};

const getErrorMessage = (value: unknown) => {
  if (
    value &&
    typeof value === "object" &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return "Request failed";
};

export const postAction = async <TResponse>(
  path: string,
  payload: ActionPayload,
  options: PostActionOptions = {}
) => {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  const data = (await response.json().catch(() => null)) as TResponse | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  if (options.revalidate ?? true) {
    await mutate(() => true, undefined, {
      revalidate: true,
    });
  }

  return data as TResponse;
};
