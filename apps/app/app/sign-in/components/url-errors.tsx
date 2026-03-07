"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export const UrlErrors = () => {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (error) {
      toast.error(error, { description: errorDescription });
      shown.current = true;
    }
  }, []);

  return null;
};
