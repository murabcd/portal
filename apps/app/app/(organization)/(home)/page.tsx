import { currentUser } from "@repo/backend/auth/utils";
import { createMetadata } from "@repo/lib/metadata";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Digest } from "./components/digest";

const Greeting = dynamic(
  () => import("./components/greeting").then((mod) => mod.Greeting),
  { loading: () => null }
);

export const metadata: Metadata = createMetadata({
  title: "Home",
  description: "The homepage for your organization.",
});

const HomeIntro = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div className="grid gap-2">
      <Greeting firstName={firstName} />
      <p className="text-muted-foreground">Here's your daily digest.</p>
    </div>
  );
};

const Home = () => (
  <div className="mx-auto grid w-full max-w-3xl gap-6 p-6 py-16">
    <Suspense fallback={null}>
      <HomeIntro />
    </Suspense>
    <div>
      <Suspense fallback={null}>
        <Digest />
      </Suspense>
    </div>
  </div>
);

export default Home;
