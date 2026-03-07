import { defineConfig } from "drizzle-kit";
import { loadMonorepoEnv } from "./load-env";

loadMonorepoEnv();

const postgresUrl = process.env.DATABASE_URL;

if (!postgresUrl) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: postgresUrl,
  },
  verbose: true,
  strict: true,
});
