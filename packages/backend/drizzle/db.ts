import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { keys } from "../keys";
import { loadMonorepoEnv } from "../load-env";
import { schema } from "./schema";

loadMonorepoEnv();

const env = keys();

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
});

export const db = drizzle(pool, { schema });
