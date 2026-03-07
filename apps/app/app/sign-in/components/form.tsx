"use client";

import { authClient } from "@repo/backend/auth/client";
import { Button } from "@repo/design-system/components/ui/button";
import { parseError } from "@repo/lib/parse-error";
import Link from "next/link";
import { toast } from "sonner";

type LoginFormProperties = {
  readonly githubAuthEnabled: boolean;
};

export const LoginForm = ({ githubAuthEnabled }: LoginFormProperties) => {
  const handleGithubSignIn = async () => {
    if (!githubAuthEnabled) {
      toast.error(
        "GitHub sign-in requires GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.local."
      );
      return;
    }

    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
      });
    } catch (error) {
      const message = parseError(error);
      toast.error(message);
    }
  };

  return (
    <div className="grid w-full gap-8 rounded-lg border bg-background p-8 shadow-sm">
      <div className="grid gap-1 text-center">
        <h1 className="font-semibold text-lg tracking-tight">
          Sign in to Portal
        </h1>
        <p className="text-muted-foreground text-sm">
          Continue with your GitHub account.
        </p>
      </div>
      <div className="grid gap-3">
        <Button onClick={handleGithubSignIn} type="button">
          Continue with GitHub
        </Button>
      </div>
      <p className="text-center text-muted-foreground text-sm">
        Don't have an account?{" "}
        <Link className="font-medium text-primary underline" href="/sign-up">
          Sign up
        </Link>
      </p>
    </div>
  );
};
