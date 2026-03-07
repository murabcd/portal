import { createMetadata } from "@repo/lib/metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FeaturesSection } from "./components/features";
import { FeedbackSection } from "./components/feedback";
import { InitiativesSection } from "./components/initiatives";
import { OverviewMetrics } from "./components/overview-metrics";
import { RoadmapSection } from "./components/roadmap";

const title = "Insights";
const description = "Trends and insights for your product.";

export const metadata: Metadata = createMetadata({ title, description });

const Insights = () => (
  <div className="divide-y">
    <section className="space-y-4 p-4 sm:p-8">
      <div className="space-y-2">
        <h1 className="m-0 font-semibold text-4xl tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Suspense fallback={null}>
        <OverviewMetrics />
      </Suspense>
    </section>
    <Suspense fallback={null}>
      <FeedbackSection />
    </Suspense>
    <Suspense fallback={null}>
      <FeaturesSection />
    </Suspense>
    <Suspense fallback={null}>
      <InitiativesSection />
    </Suspense>
    <Suspense fallback={null}>
      <RoadmapSection />
    </Suspense>
  </div>
);

export default Insights;
