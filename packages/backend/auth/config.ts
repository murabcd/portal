import "server-only";
import { keys } from "../keys";
import { loadMonorepoEnv } from "../load-env";

loadMonorepoEnv();

const env = keys();

export const isGithubAuthEnabled = Boolean(
  env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
);

export const githubProvider = isGithubAuthEnabled
  ? {
      github: {
        clientId: env.GITHUB_CLIENT_ID as string,
        clientSecret: env.GITHUB_CLIENT_SECRET as string,
      },
    }
  : {};
