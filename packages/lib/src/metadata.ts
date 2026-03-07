import { baseUrl } from "@repo/lib/consts";
import type { Metadata } from "next";

type MetadataInput = {
  title: string;
  description?: string;
};

const defaultTitle = "Portal";
const defaultDescription =
  "Portal is a home for product teams to explore problems, ideate solutions, prioritize features, and plan roadmaps with the help of AI.";
const metadataBase = new URL(baseUrl);

export const rootMetadata: Metadata = {
  metadataBase,
  applicationName: defaultTitle,
  title: {
    default: defaultTitle,
    template: `%s | ${defaultTitle}`,
  },
  description: defaultDescription,
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    siteName: defaultTitle,
    type: "website",
    locale: "en_US",
    url: metadataBase,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
};

export const createMetadata = ({
  title,
  description,
}: MetadataInput): Metadata => ({
  title,
  description: description ?? defaultDescription,
  openGraph: {
    title,
    description: description ?? defaultDescription,
    siteName: defaultTitle,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: description ?? defaultDescription,
  },
});
