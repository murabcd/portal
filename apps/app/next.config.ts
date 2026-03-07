import { withBackend } from "@repo/backend/next-config";
import { config, withAnalyzer } from "@repo/next-config";
import type { NextConfig } from "next";
import { env } from "@/env";

let nextConfig: NextConfig = withBackend({
  ...config,
  cacheComponents: true,

  async redirects() {
    return [
      {
        source: "/features/groups",
        destination: "/features",
        permanent: true,
      },
      {
        source: "/features/products",
        destination: "/features",
        permanent: true,
      },
      {
        source: "/data",
        destination: "/data/users",
        permanent: false,
      },
      {
        source: "/api/webhooks/:path*",
        destination: "https://api.portal.ai/webhooks/:path*",
        permanent: true,
      },
      {
        source: "/select-organization",
        destination: "/setup",
        permanent: true,
      },
    ];
  },
});

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
