import { useEffect, useRef } from "react";

/**
 * Poll `callback` every `interval` ms, starting immediately on mount.
 *
 * - Pauses while the browser tab is hidden (saves requests), and refetches once
 *   as soon as the tab becomes visible again.
 * - Skips a tick if the previous request is still in flight (no overlap/pile-up).
 * - Always invokes the latest `callback`, so it can freely close over state/props
 *   without needing to be memoised.
 * - Re-initialises (immediate refetch + restarted timer) whenever a value in
 *   `deps` changes — e.g. the active filter or the route param.
 *
 * Chosen over WebSockets because the data changes infrequently; this keeps the
 * stack a plain Django REST API with no ASGI/Channels/Redis to operate.
 */
export default function usePolling(callback, interval = 10000, deps = []) {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  const inFlight = useRef(false);

  useEffect(() => {
    let timer = null;

    const run = async () => {
      if (inFlight.current || document.hidden) return;
      inFlight.current = true;
      try {
        await cbRef.current();
      } catch {
        // each callback is responsible for its own error handling
      } finally {
        inFlight.current = false;
      }
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      timer = setInterval(run, interval);
    };

    run();   // fetch immediately
    start(); // then poll

    const onVisibility = () => {
      if (document.hidden) stop();
      else {
        run();
        start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval, ...deps]);
}
