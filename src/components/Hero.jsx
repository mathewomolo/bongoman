import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import StoreButtons from "./StoreButtons.jsx";
import "./Hero.css";

/* ---------------------------------------------------------------
   THE LAYER STACK, BACK TO FRONT

     hero__plate      hero-plate.png, opaque, never moves
     hero__halftone   comic dot texture over the plate only
     hero__sun        drawn, parallax -60
     hero__carousel   three skyline PNGs, parallax -140
     hero__ground     fade into the next section
     hero__birds      drawn, parallax -220
     hero__content    copy and store buttons
     hero__dots       carousel indicators
     hero__scrollcue

   The carousel paints ABOVE the sun, which is the whole reason the
   three files are PNG. Everything above the roofline in them is
   genuinely transparent; an opaque pixel up there erases the sun.

   The code-drawn <Skyline /> that used to live here is gone. The
   carousel images are its replacement, so keeping it would have put
   two cities in the same band.
   --------------------------------------------------------------- */

// PLACEHOLDER: three labelled 2400x1350 stand-ins in public/images/hero/.
// Real skyline art drops in at the same names with no code change.
//
// Two things the real art has to honour, learned from compositing the
// placeholders against the sun:
//   1. Keep the tallest roofline at roughly the same height in all three.
//      A crossfade between skylines of different overall height reads as
//      the city jumping rather than the scene changing.
//   2. Keep the subject in the middle 60%. These are 16:9 and the hero is
//      taller than that on a phone, so object-fit crops the sides.
const SLIDES = [
  "/images/hero/hero-01.png",
  "/images/hero/hero-02.png",
  "/images/hero/hero-03.png",
];

// How long each frame holds before advancing.
const SLIDE_MS = 6000;

// PLACEHOLDER: Sun and Birds are still drawn rather than illustrated.
// Both are SVG, so both already have the alpha the layering depends on.
// Swap them for exported art later; the motion wiring does not change.

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
  // The carousel inherits the old skyline's rate because it IS the
  // skyline now. Keeping -140 keeps the depth relationship between sun,
  // city and birds exactly as it already reads.
  const carouselY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const birdsY = useTransform(scrollYProgress, [0, 1], [0, -220]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const reduceMotion = useReducedMotion();
  const [slide, setSlide] = useState(0);

  // setTimeout keyed on `slide`, not setInterval. With an interval, a
  // click on the third dot could be followed a quarter second later by an
  // auto-advance that was already in flight. Re-arming a timeout every
  // time the slide changes means every frame gets its full dwell,
  // including one the visitor chose.
  //
  // The updater is a function of the previous value rather than reading
  // `slide` from the closure. That is the same rule the story feed
  // needed: React runs updaters more than once in dev StrictMode, so they
  // have to be pure.
  //
  // There is deliberately no pause-on-hover. The hero is min-height 100vh,
  // so a pointer resting anywhere in the window while the visitor is at
  // the top of the page counts as hovering it, and the carousel would
  // simply never advance on a desktop. Pausing on hover is for a carousel
  // somebody is reading. This one is scenery.
  useEffect(() => {
    if (reduceMotion) return undefined;
    const id = setTimeout(() => {
      setSlide((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_MS);
    return () => clearTimeout(id);
  }, [slide, reduceMotion]);

  return (
    <section
      className="hero"
      id="top"
      ref={sectionRef}
    >
      <div className="hero__plate" />
      <div className="halftone hero__halftone" />

      <motion.div className="hero__sun" style={{ y: sunY }}>
        <Sun />
      </motion.div>

      <motion.div className="hero__carousel" style={{ y: carouselY }}>
        {/* All three are mounted at once and crossfaded with opacity,
            rather than mounting and unmounting the active one through
            AnimatePresence. Two reasons. The browser fetches all three
            up front, so the first transition does not flash an empty
            frame while slide two downloads. And a crossfade needs both
            images painting simultaneously anyway, which is exactly what
            two always-mounted elements give you for free.

            initial={false} stops all three animating their opacity in on
            first paint, which would show the stack briefly stacked. */}
        {SLIDES.map((src, i) => (
          <motion.img
            key={src}
            className="hero__slide"
            src={src}
            alt=""
            aria-hidden="true"
            width="2400"
            height="1350"
            initial={false}
            animate={{ opacity: i === slide ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, ease: "easeInOut" }}
          />
        ))}
      </motion.div>

      <div className="hero__ground" />

      <motion.div className="hero__birds" style={{ y: birdsY }}>
        <Birds />
      </motion.div>

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

      {/* Bottom RIGHT, not bottom centre. The scroll cue already owns the
          centre of that edge and the two would have sat on top of each
          other.

          A real <button> each rather than a styled div, so the set is
          reachable by keyboard and announced properly. aria-current tells
          a screen reader which frame is showing without needing the
          visual fill. */}
      <div className="hero__dots">
        {SLIDES.map((src, i) => (
          <button
            key={src}
            type="button"
            className={i === slide ? "hero__dot hero__dot--active" : "hero__dot"}
            aria-label={`Show background ${i + 1} of ${SLIDES.length}`}
            aria-current={i === slide ? "true" : undefined}
            onClick={() => setSlide(i)}
          />
        ))}
      </div>

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