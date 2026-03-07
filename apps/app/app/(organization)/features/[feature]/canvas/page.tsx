import { PortalRole } from "@repo/backend/auth";
import { currentUser } from "@repo/backend/auth/utils";
import { database, tables } from "@repo/backend/database";
import type { CanvasState } from "@repo/canvas";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FeatureCanvasLoader } from "./components/feature-canvas-loader";

type FeatureCanvasProperties = {
  readonly params: Promise<{
    readonly feature: string;
  }>;
};

const FeatureCanvasContent = async (props: FeatureCanvasProperties) => {
  const params = await props.params;
  const user = await currentUser();

  if (!user) {
    notFound();
  }

  const feature = await database
    .select({
      title: tables.feature.title,
      canvas: tables.feature.canvas,
    })
    .from(tables.feature)
    .where(eq(tables.feature.id, params.feature))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!feature) {
    notFound();
  }

  return (
    <div className="relative flex flex-1">
      <FeatureCanvasLoader
        defaultValue={feature.canvas as unknown as CanvasState | undefined}
        editable={user.organizationRole !== PortalRole.Member}
        featureId={params.feature}
      />
    </div>
  );
};

const FeatureCanvas = (props: FeatureCanvasProperties) => (
  <Suspense fallback={null}>
    <FeatureCanvasContent {...props} />
  </Suspense>
);

export default FeatureCanvas;
