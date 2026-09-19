import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "auto";
    }

    const navigationEntry =
      performance.getEntriesByType?.("navigation")?.[0];

    const isHardRefresh =
      location.key === "default" &&
      navigationEntry?.type === "reload";

    /*
      On a real browser refresh, do nothing.
      Let the browser restore the exact previous scroll position.

      This check is safe with React StrictMode because it does NOT rely
      on a first-render ref that gets affected by the development
      double-effect cycle.
    */
    if (isHardRefresh) {
      return;
    }

    if (location.hash) {
      window.requestAnimationFrame(() => {
        const target = document.querySelector(location.hash);

        if (target) {
          target.scrollIntoView({
            behavior: "auto",
            block: "start",
          });
        }
      });

      return;
    }

    // Normal React Router navigation should start at the top.
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [
    location.key,
    location.pathname,
    location.hash,
  ]);

  return null;
}

export default ScrollToTop;
