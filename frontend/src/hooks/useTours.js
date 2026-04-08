import { useEffect, useMemo, useState } from "react";
import { fallbackNormalizedTours, subscribeToTours } from "../utils/tourSchema";

export const useTours = () => {
  const [tours, setTours] = useState(fallbackNormalizedTours);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("local");

  useEffect(() => {
    const unsubscribe = subscribeToTours((nextTours, meta = {}) => {
      setTours(Array.isArray(nextTours) ? nextTours : fallbackNormalizedTours);
      setSource(meta.source || "local");
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const featuredTours = useMemo(
    () => tours.filter((tour) => tour.featured),
    [tours],
  );

  return {
    tours,
    featuredTours,
    loading,
    source,
  };
};

export default useTours;
