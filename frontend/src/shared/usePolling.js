import { useEffect, useRef } from "react";
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
  }, [interval, ...deps]);
}
