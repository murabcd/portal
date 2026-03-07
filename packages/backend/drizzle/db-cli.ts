import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { keys } from "../keys";
import { loadMonorepoEnv } from "../load-env";
import { schema } from "./schema";

loadMonorepoEnv();

const env = keys();

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 2000,
});

export const dbCli = drizzle(pool, { schema });
