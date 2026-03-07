"use client";

import { mutate } from "swr";

type ActionPayload = {
  readonly action: string;
  readonly args: unknown[];
};

type PostActionOptions = {
  readonly revalidate?: boolean;
};

const activityPrefix = "/api/activity";
const changelogPrefix = "/api/changelog";
const companiesPrefix = "/api/data/companies";
const featuresPrefix = "/api/features";
const feedbackPrefix = "/api/feedback";
const readOnlyActionRegex = /^(fetch|get|parse|search)/u;
const usersPrefix = "/api/data/users";

const isReadOnlyAction = (action: string) => readOnlyActionRegex.test(action);

const getRevalidationPrefixes = (path: string) => {
  const prefixes = new Set<string>([activityPrefix]);

  if (
    path.includes("/feature") ||
    path.includes("/product") ||
    path.includes("/group") ||
    path.includes("/release") ||
    path.includes("/roadmap-event") ||
    path.includes("/feature-status")
  ) {
    prefixes.add(featuresPrefix);
  }

  if (path.includes("/feedback")) {
    prefixes.add(feedbackPrefix);
    prefixes.add(usersPrefix);
    prefixes.add(companiesPrefix);
  }

  if (path.includes("/changelog")) {
    prefixes.add(changelogPrefix);
  }

  return [...prefixes];
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

  if ((options.revalidate ?? true) && !isReadOnlyAction(payload.action)) {
    const prefixes = getRevalidationPrefixes(path);

    await mutate(
      (key) =>
        typeof key === "string" &&
        prefixes.some(
          (prefix) => key === prefix || key.startsWith(`${prefix}?`)
        ),
      undefined,
      {
        revalidate: true,
      }
    );
  }

  return data as TResponse;
};
