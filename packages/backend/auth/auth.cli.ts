import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { dbCli } from "../drizzle/db-cli";
import { schema } from "../drizzle/schema";
import { keys } from "../keys";
import { loadMonorepoEnv } from "../load-env";
import { githubProvider } from "./config";

loadMonorepoEnv();

const env = keys();

export const auth = betterAuth({
  database: drizzleAdapter(dbCli, {
    provider: "pg",
    schema,
  }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 300,
    },
  },
  socialProviders: githubProvider,
  user: {
    additionalFields: {
      organizationId: {
        type: "string",
        required: false,
      },
      organizationRole: {
        type: "string",
        required: false,
      },
    },
  },
});
