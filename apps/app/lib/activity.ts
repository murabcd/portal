import type { GetActivityResponse } from "@/actions/activity/get";

const deserializeCollection = <T extends { createdAt: Date | string }>(
  collection: T[]
) =>
  collection.map((item) => ({
    ...item,
    createdAt:
      item.createdAt instanceof Date
        ? item.createdAt
        : new Date(item.createdAt),
  }));

export const deserializeActivityPage = (
  data: Record<string, unknown>
): GetActivityResponse => ({
  ...(data as GetActivityResponse),
  date: data.date instanceof Date ? data.date : new Date(data.date as string),
  initiatives: deserializeCollection(
    data.initiatives as Array<
      GetActivityResponse["initiatives"][number] & { createdAt: Date | string }
    >
  ) as GetActivityResponse["initiatives"],
  initiativeMembers: deserializeCollection(
    data.initiativeMembers as Array<
      GetActivityResponse["initiativeMembers"][number] & {
        createdAt: Date | string;
      }
    >
  ) as GetActivityResponse["initiativeMembers"],
  initiativePages: deserializeCollection(
    data.initiativePages as Array<
      GetActivityResponse["initiativePages"][number] & {
        createdAt: Date | string;
      }
    >
  ) as GetActivityResponse["initiativePages"],
  initiativeCanvases: deserializeCollection(
    data.initiativeCanvases as Array<
      GetActivityResponse["initiativeCanvases"][number] & {
        createdAt: Date | string;
      }
    >
  ) as GetActivityResponse["initiativeCanvases"],
  initiativeExternalLinks: deserializeCollection(
    data.initiativeExternalLinks as Array<
      GetActivityResponse["initiativeExternalLinks"][number] & {
        createdAt: Date | string;
      }
    >
  ) as GetActivityResponse["initiativeExternalLinks"],
  feedback: deserializeCollection(
    data.feedback as Array<
      GetActivityResponse["feedback"][number] & { createdAt: Date | string }
    >
  ) as GetActivityResponse["feedback"],
  products: deserializeCollection(
    data.products as Array<
      GetActivityResponse["products"][number] & { createdAt: Date | string }
    >
  ) as GetActivityResponse["products"],
  groups: deserializeCollection(
    data.groups as Array<
      GetActivityResponse["groups"][number] & { createdAt: Date | string }
    >
  ) as GetActivityResponse["groups"],
  features: deserializeCollection(
    data.features as Array<
      GetActivityResponse["features"][number] & { createdAt: Date | string }
    >
  ) as GetActivityResponse["features"],
  changelog: deserializeCollection(
    data.changelog as Array<
      GetActivityResponse["changelog"][number] & { createdAt: Date | string }
    >
  ) as GetActivityResponse["changelog"],
  apiKeys: deserializeCollection(
    data.apiKeys as Array<
      GetActivityResponse["apiKeys"][number] & { createdAt: Date | string }
    >
  ) as GetActivityResponse["apiKeys"],
  feedbackFeatureLinks: deserializeCollection(
    data.feedbackFeatureLinks as Array<
      GetActivityResponse["feedbackFeatureLinks"][number] & {
        createdAt: Date | string;
      }
    >
  ) as GetActivityResponse["feedbackFeatureLinks"],
  releases: deserializeCollection(
    data.releases as Array<
      GetActivityResponse["releases"][number] & { createdAt: Date | string }
    >
  ) as GetActivityResponse["releases"],
  members: deserializeCollection(
    data.members as Array<
      GetActivityResponse["members"][number] & { createdAt: Date | string }
    >
  ) as GetActivityResponse["members"],
});

export const normalizeActivityPage = (page: GetActivityResponse) =>
  page.date instanceof Date
    ? page
    : deserializeActivityPage(page as unknown as Record<string, unknown>);
