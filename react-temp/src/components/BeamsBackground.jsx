import { useEffect, useRef } from "react";
import "./BeamsBackground.css";

/*
  Adapted for Fixer.Co from Kokonut UI's MIT-licensed Beams Background.
  Same idea: blurred, drifting canvas light beams.
  Customized here for Fixer.Co's light background + navy/mint palette.
*/

function createBeam(width, height, index, total, isMobile) {
  const angle = -38 + Math.random() * 9;

  return {
    x: Math.random() * width * 1.4 - width * 0.2,
    y: Math.random() * height * 1.45 - height * 0.25,
    width: isMobile
      ? 24 + Math.random() * 34
      : 34 + Math.random() * 58,
    length: height * 2.25,
    angle,
    speed: isMobile
      ? 0.22 + Math.random() * 0.28
      : 0.28 + Math.random() * 0.34,
    opacity: 0.055 + Math.random() * 0.065,
    hue: 154 + (index / Math.max(total - 1, 1)) * 48 + Math.random() * 8,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.012 + Math.random() * 0.012,
  };
}

export default function BeamsBackground({ intensity = "subtle" }) {
  const canvasRef = useRef(null);
  const beamsRef = useRef([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const intensityMap = {
      subtle: 0.82,
      medium: 1,
      strong: 1.18,
    };

    let cssWidth = window.innerWidth;
    let cssHeight = window.innerHeight;

    function setup() {
      cssWidth = window.innerWidth;
      cssHeight = window.innerHeight;

      const isMobile = cssWidth <= 768;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      // Prevent scale accumulation after resize.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const total = isMobile ? 13 : 22;

      beamsRef.current = Array.from({ length: total }, (_, index) =>
        createBeam(cssWidth, cssHeight, index, total, isMobile)
      );
    }

    function resetBeam(beam, index, total) {
      const isMobile = cssWidth <= 768;
      const columns = isMobile ? 2 : 3;
      const column = index % columns;
      const spacing = cssWidth / columns;

      beam.y = cssHeight + 120;
      beam.x =
        column * spacing +
        spacing / 2 +
        (Math.random() - 0.5) * spacing * 0.7;

      beam.width = isMobile
        ? 32 + Math.random() * 40
        : 70 + Math.random() * 80;

      beam.length = cssHeight * 2.25;
      beam.speed = isMobile
        ? 0.22 + Math.random() * 0.26
        : 0.28 + Math.random() * 0.32;

      beam.opacity = 0.065 + Math.random() * 0.055;
      beam.hue = 154 + (index / Math.max(total - 1, 1)) * 48;

      return beam;
    }

    function drawBeam(beam) {
      ctx.save();
      ctx.translate(beam.x, beam.y);
      ctx.rotate((beam.angle * Math.PI) / 180);

      const opacity =
        beam.opacity *
        (0.86 + Math.sin(beam.pulse) * 0.14) *
        intensityMap[intensity];

      const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);

      gradient.addColorStop(
        0,
        `hsla(${beam.hue}, 52%, 45%, 0)`
      );
      gradient.addColorStop(
        0.12,
        `hsla(${beam.hue}, 52%, 45%, ${opacity * 0.35})`
      );
      gradient.addColorStop(
        0.38,
        `hsla(${beam.hue}, 55%, 43%, ${opacity})`
      );
      gradient.addColorStop(
        0.65,
        `hsla(${beam.hue}, 55%, 43%, ${opacity * 0.86})`
      );
      gradient.addColorStop(
        0.9,
        `hsla(${beam.hue}, 52%, 45%, ${opacity * 0.28})`
      );
      gradient.addColorStop(
        1,
        `hsla(${beam.hue}, 52%, 45%, 0)`
      );

      ctx.fillStyle = gradient;
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      ctx.restore();
    }

    function renderFrame(animate) {
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      ctx.filter = "blur(28px)";

      const total = beamsRef.current.length;

      beamsRef.current.forEach((beam, index) => {
        if (animate) {
          beam.y -= beam.speed;
          beam.pulse += beam.pulseSpeed;

          if (beam.y + beam.length < -140) {
            resetBeam(beam, index, total);
          }
        }

        drawBeam(beam);
      });
    }

    function animate() {
      renderFrame(true);
      frameRef.current = window.requestAnimationFrame(animate);
    }

    function handleVisibility() {
      if (document.hidden) {
        if (frameRef.current) {
          window.cancelAnimationFrame(frameRef.current);
          frameRef.current = 0;
        }
      } else if (!reducedMotion && !frameRef.current) {
        frameRef.current = window.requestAnimationFrame(animate);
      }
    }

    setup();

    if (reducedMotion) {
      renderFrame(false);
    } else {
      frameRef.current = window.requestAnimationFrame(animate);
    }

    window.addEventListener("resize", setup);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("resize", setup);
      document.removeEventListener("visibilitychange", handleVisibility);

      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [intensity]);

  return (
    <div className="fixer-beams" aria-hidden="true">
      <canvas ref={canvasRef} className="fixer-beams__canvas" />
      <div className="fixer-beams__wash" />
    </div>
  );
}
