import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import StoreButtons from "./StoreButtons.jsx";
import BirdFlock from "./BirdFlock.jsx";
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

/* ---- pointer parallax ------------------------------------------------

   Max travel in px at the very edge of the section, depth-scaled to
   match the scroll rates in the component below (-60, -140, -220).

   Vertical is deliberately half of horizontal. Vertical movement
   competes with the scroll feel; horizontal has nothing to compete
   with.

   Set any pair to 0 to take that layer out of it. The plate, the ground
   fade and the copy are deliberately absent: the first two are
   full-bleed, so moving them would expose a bare edge, and text that
   slides around under the pointer reads as unstable rather than deep. */
const POINTER_SHIFT = {
  sun: { x: 10, y: 5 },
  carousel: { x: 18, y: 9 },
  birds: { x: 30, y: 15 },
};

// Softness of the follow. Low stiffness on purpose, so the scene drifts
// toward the pointer rather than tracking it frame for frame, which on
// layers this large reads as twitching.
const POINTER_SPRING = { stiffness: 60, damping: 18, mass: 0.6 };

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

  /* ---- pointer parallax, additive ------------------------------------

     ADDITIVE BY CONSTRUCTION. Each layer's vertical value is its scroll
     value PLUS a pointer offset, so with the pointer at the centre of
     the section every layer sits at exactly the value it had before any
     of this existed. With no pointer at all, on touch or under reduced
     motion, the springs never leave 0 and the scroll parallax is
     untouched. That is the guarantee, and it is checkable rather than a
     promise.

     Horizontal is free, because framer composes x and y separately and
     nothing else writes x.

     Vertical is combined into ONE motion value rather than set twice.
     transform is a single property, so a second y on the same element
     would overwrite the first and the scroll parallax would silently
     stop working. Same rule the sun's centring fell foul of; see
     Hero.css. */
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const px = useSpring(pointerX, POINTER_SPRING);
  const py = useSpring(pointerY, POINTER_SPRING);

  const sunPX = useTransform(px, (v) => v * POINTER_SHIFT.sun.x);
  const sunPY = useTransform([sunY, py], ([s, p]) => s + p * POINTER_SHIFT.sun.y);
  const carouselPX = useTransform(px, (v) => v * POINTER_SHIFT.carousel.x);
  const carouselPY = useTransform([carouselY, py], ([s, p]) => s + p * POINTER_SHIFT.carousel.y);
  const birdsPX = useTransform(px, (v) => v * POINTER_SHIFT.birds.x);
  const birdsPY = useTransform([birdsY, py], ([s, p]) => s + p * POINTER_SHIFT.birds.y);

  useEffect(() => {
    if (reduceMotion) return undefined;

    // Same gate as CustomCursor. A touch device has no pointer to
    // follow, and the springs simply stay at 0, which is the untouched
    // scroll-only scene.
    if (!window.matchMedia("(pointer: fine)").matches) return undefined;

    const section = sectionRef.current;
    if (!section) return undefined;

    /* The rect is cached and refreshed on scroll and resize rather than
       read inside the move handler. Reading it per move forces a layout
       on every frame the pointer is inside a section this large. */
    let rect = section.getBoundingClientRect();
    const measure = () => {
      rect = section.getBoundingClientRect();
    };

    // Normalised to -1..1 from the centre of the section, so the
    // constants above are readable as "px at the very edge" rather than
    // as a scale factor against an arbitrary pixel distance.
    const handleMove = (event) => {
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      pointerX.set(Math.max(-1, Math.min(1, nx)));
      pointerY.set(Math.max(-1, Math.min(1, ny)));
    };

    // Back to centre, so the scene settles to exactly its scroll-only
    // position rather than freezing wherever the pointer left it.
    const handleLeave = () => {
      pointerX.set(0);
      pointerY.set(0);
    };

    section.addEventListener("pointermove", handleMove, { passive: true });
    section.addEventListener("pointerleave", handleLeave);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      section.removeEventListener("pointermove", handleMove);
      section.removeEventListener("pointerleave", handleLeave);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [reduceMotion, pointerX, pointerY]);

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

      <motion.div className="hero__sun" style={{ x: sunPX, y: sunPY }}>
        <Sun />
      </motion.div>

      <motion.div className="hero__carousel" style={{ x: carouselPX, y: carouselPY }}>
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

      <motion.div className="hero__birds" style={{ x: birdsPX, y: birdsPY }}>
        <Birds />
      </motion.div>

      {/* The startled flock. Same z-index band as the resting birds, so
          a burst flies through the scene rather than over the copy. It
          listens for clicks on the section itself, which is why it can
          sit anywhere in here. */}
      <BirdFlock />

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