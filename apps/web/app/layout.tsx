import "./styles.css";
import { DesignSystemProvider } from "@repo/design-system/components/provider";
import { fonts } from "@repo/design-system/lib/fonts";
import { rootMetadata } from "@repo/lib/metadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

type RootLayoutProperties = {
  readonly children: ReactNode;
};

export const metadata: Metadata = rootMetadata;

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html className={fonts} lang="en" suppressHydrationWarning>
    <body className="min-h-screen bg-backdrop">
      <DesignSystemProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </DesignSystemProvider>
    </body>
  </html>
);

export default RootLayout;
