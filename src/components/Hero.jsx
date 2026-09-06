import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import StoreButtons from "./StoreButtons.jsx";
import "./Hero.css";

// PLACEHOLDER: every shape below (Sun, Skyline, Birds) is a stand-in
// built from CSS/SVG, used to prove out the parallax scroll feel before
// real art exists. Swap <Skyline />, <Sun />, and <Birds /> for illustrated
// or exported layers later; the scroll-linked motion wiring stays the same.

function Sun() {
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true">
      <circle cx="200" cy="200" r="150" fill="url(#sunGradient)" />
      <defs>
        <radialGradient id="sunGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-gold-bright)" />
          <stop offset="60%" stopColor="var(--color-gold)" />
          <stop offset="100%" stopColor="var(--color-action-red)" stopOpacity="0.15" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function Skyline() {
  // Rough Nairobi-ish skyline silhouette: varied building blocks.
  const buildings = [
    { x: 0, w: 60, h: 140 },
    { x: 55, w: 40, h: 210 },
    { x: 90, w: 70, h: 170 },
    { x: 155, w: 45, h: 260 },
    { x: 195, w: 55, h: 190 },
    { x: 245, w: 35, h: 230 },
    { x: 275, w: 65, h: 150 },
    { x: 335, w: 50, h: 200 },
    { x: 380, w: 40, h: 165 },
    { x: 415, w: 60, h: 220 },
    { x: 470, w: 45, h: 180 },
    { x: 510, w: 70, h: 240 },
    { x: 575, w: 40, h: 160 },
  ];
  return (
    <svg viewBox="0 0 620 280" preserveAspectRatio="none" aria-hidden="true">
      {buildings.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={280 - b.h}
          width={b.w}
          height={b.h}
          fill="#2a2129"
          stroke="rgba(242, 169, 59, 0.22)"
          strokeWidth="1"
        />
      ))}
      {/* Lit windows were picked with Math.random() during render, which
          meant every re-render of this component dealt a fresh hand and
          the whole skyline flickered. A cheap deterministic hash of the
          building and row index gives the same scattered look while
          staying identical on every render. */}
      {buildings.map((b, i) =>
        Array.from({ length: Math.floor(b.h / 26) }).map((_, r) =>
          (i * 7 + r * 13) % 5 > 1 ? (
            <rect
              key={`${i}-${r}`}
              x={b.x + b.w / 2 - 4}
              y={280 - b.h + 14 + r * 26}
              width="6"
              height="8"
              fill="var(--color-gold)"
              opacity="0.85"
            />
          ) : null
        )
      )}
    </svg>
  );
}

function Birds() {
  const marks = [
    { x: 60, y: 40, s: 1 },
    { x: 110, y: 70, s: 0.7 },
    { x: 20, y: 90, s: 0.55 },
    { x: 160, y: 30, s: 0.6 },
  ];
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true">
      {marks.map((m, i) => (
        <path
          key={i}
          d={`M ${m.x - 8 * m.s} ${m.y} Q ${m.x} ${m.y - 8 * m.s} ${m.x + 8 * m.s} ${m.y} Q ${m.x} ${m.y - 8 * m.s} ${m.x - 8 * m.s} ${m.y}`}
          fill="none"
          stroke="var(--color-paper)"
          strokeWidth="2"
          opacity="0.55"
        />
      ))}
    </svg>
  );
}

export default function Hero() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const sunY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const skylineY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const birdsY = useTransform(scrollYProgress, [0, 1], [0, -220]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section className="hero" id="top" ref={sectionRef}>
      <div className="hero__sky" />
      <div className="halftone hero__halftone" />

      <motion.div className="hero__sun" style={{ y: sunY }}>
        <Sun />
      </motion.div>

      <motion.div className="hero__birds" style={{ y: birdsY }}>
        <Birds />
      </motion.div>

      <motion.div className="hero__skyline" style={{ y: skylineY }}>
        <Skyline />
      </motion.div>

      <div className="hero__ground" />

      <motion.div className="hero__content" style={{ y: titleY, opacity: contentOpacity }}>
        <div className="container hero__inner">
          <motion.p
            className="eyebrow hero__eyebrow"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            A Kenyan comic hero
          </motion.p>

          <motion.h1
            className="hero__title comic-outline"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            BONGOMAN
          </motion.h1>

          <motion.p
            className="hero__tagline"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            From Page to Play
          </motion.p>

          <motion.p
            className="hero__sub"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            Since 1989 he has lived on Kenyan newspaper pages. Now he moves, in a 2D
            action platformer set in Nairobi and the country beyond it.
          </motion.p>

          {/* The platform pills that used to sit here said the same
              thing these buttons say, minus the ability to act on it.
              A marketing page's first screen should always offer the
              next step: someone arriving from a QR sticker gives you a
              few seconds and will not scroll nine screens to find it. */}
          <motion.div
            className="hero__actions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <StoreButtons size="small" />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="hero__scrollcue"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <span>Enter Nairobi</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </section>
  );
}