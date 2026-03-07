import { vercel } from "@t3-oss/env-core/presets-zod";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v3";

export const keys = () =>
  createEnv({
    extends: [vercel()],
    server: {
      ANALYZE: z.string().optional(),

      // Added by Vercel
      NEXT_RUNTIME: z.enum(["nodejs", "edge"]).optional(),

      // URLs
      PORTAL_WEB_URL: z.string().url().min(1),
      PORTAL_API_URL: z.string().url().min(1),

      // Node
      NODE_ENV: z.enum(["development", "production", "test"]).optional(),
    },
    client: {},
    runtimeEnv: {
      ANALYZE: process.env.ANALYZE,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME,
      PORTAL_WEB_URL: process.env.PORTAL_WEB_URL,
      PORTAL_API_URL: process.env.PORTAL_API_URL,
      NODE_ENV: process.env.NODE_ENV,
    },
  });
