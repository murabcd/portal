import { isGithubAuthEnabled } from "@repo/backend/auth/config";
import type { Metadata } from "next";
import { handleAuthedState } from "@/lib/auth";
import { createMetadata } from "@/lib/metadata";
import { SignupForm } from "./components/form";

const title = "Sign up";
const description = "Sign up to your account.";

export const metadata: Metadata = createMetadata({ title, description });

const SignUpPage = async () => {
  await handleAuthedState();

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="w-full max-w-[400px] space-y-8">
        <SignupForm githubAuthEnabled={isGithubAuthEnabled} />
        <p className="text-balance text-center text-muted-foreground text-sm">
          By signing in, you agree to our{" "}
          <a
            className="font-medium text-primary underline"
            href="https://www.portal.ai/legal/terms"
            rel="noreferrer noopener"
            target="_blank"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            className="font-medium text-primary underline"
            href="https://www.portal.ai/legal/privacy"
            rel="noreferrer noopener"
            target="_blank"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
