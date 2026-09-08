import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./FixerIntro.css";

function FixerIntro() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [visible, setVisible] = useState(() => {
    return (
      pathname === "/" &&
      sessionStorage.getItem("fixerIntroSeen") !== "true"
    );
  });

  const [leaving, setLeaving] = useState(false);

  function destinationAfterIntro() {
    const loggedIn =
      localStorage.getItem("isLoggedIn") === "true";

    const guestMode =
      localStorage.getItem("guestMode") === "true";

    // Existing signed-in users and users who already selected Guest
    // continue directly to Home.
    if (loggedIn || guestMode) {
      return "/";
    }

    // First-time / unauthenticated visitor sees Login after Intro.
    return "/login";
  }

  function finishIntro() {
    sessionStorage.setItem("fixerIntroSeen", "true");

    const destination = destinationAfterIntro();

    setLeaving(true);

    window.setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";

      if (destination !== pathname) {
        navigate(destination, { replace: true });
      }
    }, 620);
  }

  useEffect(() => {
    if (!visible || pathname !== "/") return;

    const oldOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const finishTimer =
      window.setTimeout(
        finishIntro,
        2450
      );

    return () => {
      window.clearTimeout(
        finishTimer
      );

      document.body.style.overflow =
        oldOverflow;
    };
    // Run only for this intro mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, pathname]);

  function skipIntro() {
    finishIntro();
  }

  if (!visible || pathname !== "/") {
    return null;
  }

  return (
    <div
      className={`fixer-path-intro ${
        leaving ? "is-leaving" : ""
      }`}
    >
      <svg
        className="fixer-paths-svg"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="fixerPathGreen"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#4faf8f" stopOpacity="0" />
            <stop offset="48%" stopColor="#4faf8f" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#67c2a4" stopOpacity="0" />
          </linearGradient>

          <linearGradient
            id="fixerPathNavy"
            x1="0%"
            y1="100%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#173b57" stopOpacity="0" />
            <stop offset="50%" stopColor="#173b57" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#102d43" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path className="fixer-path fixer-path-1" pathLength="1"
          d="M-120 690 C120 500 280 520 450 410 C650 280 810 320 1010 190 C1190 70 1370 70 1710 -70" />
        <path className="fixer-path fixer-path-2" pathLength="1"
          d="M-100 180 C160 320 310 290 520 390 C720 485 860 610 1110 590 C1320 570 1470 690 1710 810" />
        <path className="fixer-path fixer-path-3" pathLength="1"
          d="M180 -80 C250 120 420 160 480 310 C545 475 470 620 610 780 C700 880 790 920 900 980" />
        <path className="fixer-path fixer-path-4" pathLength="1"
          d="M1270 -120 C1190 90 1040 190 1020 350 C990 560 1140 680 1080 890 C1050 980 990 1030 930 1080" />
        <path className="fixer-path fixer-path-5" pathLength="1"
          d="M-40 500 C200 440 390 470 560 520 C760 580 910 510 1100 450 C1310 380 1470 390 1660 480" />
      </svg>

      <div className="fixer-path-orb fixer-path-orb-one" aria-hidden="true" />
      <div className="fixer-path-orb fixer-path-orb-two" aria-hidden="true" />

      <div className="fixer-path-brand">
        <div className="fixer-path-brand-name">
          <span className="fixer-path-fixer">Fixer</span>
          <span className="fixer-path-co">.Co</span>
        </div>

        <div className="fixer-path-brand-line" aria-hidden="true" />
        <p className="fixer-path-tagline">
          The right fix. Right around you.
        </p>
      </div>

      <button
        type="button"
        className="fixer-path-skip"
        onClick={skipIntro}
      >
        Skip
      </button>
    </div>
  );
}

export default FixerIntro;
