import "./styles.css";
import { DesignSystemProvider } from "@repo/design-system/components/provider";
import { fonts } from "@repo/design-system/lib/fonts";
import { rootMetadata } from "@repo/lib/metadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SWRProvider } from "@/providers/swr-provider";

type RootLayoutProperties = {
  readonly children: ReactNode;
};

export const metadata: Metadata = rootMetadata;

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html className={fonts} lang="en" suppressHydrationWarning>
    <body className="min-h-screen bg-backdrop">
      <DesignSystemProvider>
        <SWRProvider>{children}</SWRProvider>
      </DesignSystemProvider>
    </body>
  </html>
);

export default RootLayout;
