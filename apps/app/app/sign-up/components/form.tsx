"use client";
import { authClient } from "@repo/backend/auth/client";
import { Button } from "@repo/design-system/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

type SignupFormProperties = {
  readonly githubAuthEnabled: boolean;
};

export const SignupForm = ({ githubAuthEnabled }: SignupFormProperties) => {
  const handleGithubSignUp = async () => {
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
    } catch (_error) {
      toast.error("Unable to start GitHub sign-in.");
    }
  };

  return (
    <div className="grid w-full gap-8 rounded-lg border bg-background p-8 shadow-sm">
      <div className="grid gap-1 text-center">
        <h1 className="font-semibold text-lg tracking-tight">
          Create your account
        </h1>
        <p className="text-muted-foreground text-sm">
          Continue with your GitHub account.
        </p>
      </div>
      <div className="grid gap-2">
        <Button onClick={handleGithubSignUp} type="button">
          Continue with GitHub
        </Button>
      </div>
      <p className="text-center text-muted-foreground text-sm">
        Already have an account?{" "}
        <Link className="font-medium text-primary underline" href="/sign-in">
          Sign in
        </Link>
      </p>
    </div>
  );
};
