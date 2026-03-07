import { handleError } from "@repo/design-system/lib/handle-error";
import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

type InfiniteLoaderProperties = {
  readonly onView: () => Promise<unknown>;
  readonly loading?: boolean;
};

export const InfiniteLoader = ({
  onView,
  loading,
}: InfiniteLoaderProperties) => {
  const [visible, setVisible] = useState(false);
  const listReference = useRef<HTMLDivElement>(null);
  const inView = useInView(listReference, {});

  useEffect(() => {
    if (loading) {
      return;
    }

    if (visible) {
      onView()
        .then(() => setVisible(false))
        .catch(handleError);
    } else if (inView) {
      setVisible(true);
    }
  }, [inView, onView, visible, loading]);

  return <div className="h-1 w-full" ref={listReference} />;
};
