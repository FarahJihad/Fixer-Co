import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./FixerIntro.css";
import BeamsBackground from "./BeamsBackground.jsx";

const INTRO_KEY = "fixerIntroBeamsV1Seen";

const leftLetters = ["F", "i", "x", "e", "r"];
const rightLetters = ["C", "o"];

function FixerIntro() {
  const { pathname } = useLocation();

  const [visible, setVisible] = useState(() => {
    return pathname === "/" && sessionStorage.getItem(INTRO_KEY) !== "true";
  });

  const [phase, setPhase] = useState("brand");
  const [imageIndex, setImageIndex] = useState(0);
  const pivotRef = useRef(null);
  const [brandShift, setBrandShift] = useState(0);

  const images = useMemo(
    () => [
      "/media/services/plumbing.png",
      "/media/services/electrical.png",
      "/media/services/general-maintenance.png",
      "/media/hero/fixer-hero-bg.png",
    ],
    []
  );

  useLayoutEffect(() => {
    if (!visible || pathname !== "/") return undefined;

    let cancelled = false;

    const measure = () => {
      if (cancelled || !pivotRef.current) return;

      const rect = pivotRef.current.getBoundingClientRect();
      const pivotCenter = rect.left + rect.width / 2;
      const viewportCenter = window.innerWidth / 2;

      // Move the WORDMARK slightly so the image square itself
      // is exactly centered before it expands.
      setBrandShift(viewportCenter - pivotCenter);
    };

    const frame = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);

    if (document.fonts?.ready) {
      document.fonts.ready.then(measure);
    }

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [visible, pathname]);

  useEffect(() => {
    if (!visible || pathname !== "/") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timers = [
      // Let the full wordmark finish entering, then hold for about a second.
      window.setTimeout(() => setPhase("open"), 1750),
      window.setTimeout(() => {
        setPhase("gallery");
        setImageIndex(0);
      }, 2380),
      window.setTimeout(() => setImageIndex(1), 2625),
      window.setTimeout(() => setImageIndex(2), 3000),
      window.setTimeout(() => {
        setImageIndex(3);
        setPhase("final");
      }, 3460),
      // No intermediate banner.
      // The last square opens directly into the Home hero.
      window.setTimeout(() => setPhase("expand"), 4150),
      window.setTimeout(() => setPhase("reveal"), 5250),
      window.setTimeout(() => {
        sessionStorage.setItem(INTRO_KEY, "true");
        setVisible(false);
        document.body.style.overflow = previousOverflow;
        window.dispatchEvent(new Event("fixer-intro-complete"));
      }, 5800),
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      document.body.style.overflow = previousOverflow;
    };
  }, [visible, pathname]);

  function skipIntro() {
    sessionStorage.setItem(INTRO_KEY, "true");
    document.body.style.overflow = "";
    setVisible(false);
    window.dispatchEvent(new Event("fixer-intro-complete"));
  }

  if (!visible || pathname !== "/") return null;

  return (
    <div className={`fixer-intro fixer-intro--${phase}`}>
      <BeamsBackground intensity="subtle" />
      <div className="fixer-intro__stage">
        <div className="fixer-intro__brand" aria-label="Fixer.Co" style={{ "--brand-shift": `${brandShift}px` }}>
          <span className="fixer-intro__word fixer-intro__word--left">
            {leftLetters.map((letter, index) => (
              <span
                key={`${letter}-${index}`}
                className="fixer-intro__char"
                style={{ "--char-index": index }}
              >
                {letter}
              </span>
            ))}
          </span>

          <span ref={pivotRef} className="fixer-intro__pivot" aria-hidden="true">
            <span
              className="fixer-intro__dot fixer-intro__char"
              style={{ "--char-index": 5 }}
            >
              .
            </span>

            <span className="fixer-intro__window">
              {images.map((src, index) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className={`fixer-intro__image ${
                    imageIndex === index ? "is-active" : ""
                  } ${index === images.length - 1 ? "is-home-image" : ""}`}
                />
              ))}
              <span className="fixer-intro__window-shine" />
            </span>
          </span>

          <span className="fixer-intro__word fixer-intro__word--right">
            {rightLetters.map((letter, index) => (
              <span
                key={`${letter}-${index}`}
                className="fixer-intro__char"
                style={{ "--char-index": index + 6 }}
              >
                {letter}
              </span>
            ))}
          </span>
        </div>

      </div>

      <button type="button" className="fixer-intro__skip" onClick={skipIntro}>
        Skip
      </button>
    </div>
  );
}

export default FixerIntro;
