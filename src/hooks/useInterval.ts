/**
 * useInterval hook for managing intervals in React.
 * Based on Dan Abramov's pattern: https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 *
 * @param callback - Function to call at each interval
 * @param delay - Interval delay in milliseconds, or null to pause
 */

import { useEffect, useRef } from "react";

export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // Store latest callback in ref to avoid stale closures
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    // Don't start interval if delay is null (paused)
    if (delay === null) {
      return;
    }

    const id = setInterval(() => {
      savedCallback.current();
    }, delay);

    // Cleanup on unmount or when delay changes
    return () => clearInterval(id);
  }, [delay]);
}
