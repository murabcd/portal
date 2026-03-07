import { keys as core } from "@repo/next-config/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v3";

export const env = createEnv({
  extends: [core()],
  server: {
    PORTAL_ADMIN_WIDGET_ID: z.string().min(1),
  },
  client: {},
  runtimeEnv: {
    PORTAL_ADMIN_WIDGET_ID: process.env.PORTAL_ADMIN_WIDGET_ID,
  },
});
