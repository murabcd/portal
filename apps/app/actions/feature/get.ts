import type { Feature } from "@repo/backend/types";

export type GetFeatureResponse = Pick<
  Feature,
  "endAt" | "id" | "ownerId" | "startAt" | "title"
> & {
  readonly text: string;
  readonly owner: {
    readonly name: string | undefined;
    readonly email: string | undefined;
    readonly imageUrl: string | undefined;
  } | null;
};
