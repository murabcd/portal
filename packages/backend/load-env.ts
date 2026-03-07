import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

let loaded = false;

export const loadMonorepoEnv = () => {
  if (loaded) {
    return;
  }

  loaded = true;

  const searchRoots = [
    process.cwd(),
    resolve(process.cwd(), ".."),
    resolve(process.cwd(), "../.."),
  ];

  for (const root of searchRoots) {
    const envLocalPath = resolve(root, ".env.local");
    const envPath = resolve(root, ".env");

    if (existsSync(envLocalPath)) {
      loadEnv({ path: envLocalPath, override: false });
    }

    if (existsSync(envPath)) {
      loadEnv({ path: envPath, override: false });
    }
  }
};
