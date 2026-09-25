import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Reveal, { RevealItem } from "./Reveal.jsx";
import "./World.css";

// PLACEHOLDER: the three stage backgrounds are the labelled stand-ins in
// /public/images/world/. The crossfade wiring (scroll progress -> opacity
// per stage) stays the same once real illustrated environment art replaces
// them. Filenames and the layering that drives them live in World.css.

const stages = [
  {
    key: "urban",
    label: "Nairobi, Eastlands",
    text: "It starts in Eastlands, on the streets Bongoman actually lives on. Ordinary ground, walked at ordinary speed, before any of it turns strange.",
  },
  {
    key: "periurban",
    label: "Beyond the City",
    text: "Past the last of the tarmac the city thins out into half-built plots, farmland and open road. Still recognizably Kenya, drawn with a comic book's sense of scale.",
  },
  {
    key: "rural",
    label: "The Wider Landscape",
    text: "Compounds, rivers, farmland, open wilderness. The further out he gets, the more the terrain does the talking, and getting across it is the puzzle.",
  },
];

// How much of the scroll track is spent moving between two stages. The
// rest is hold. Raise it for a longer, softer transition; lower it for a
// harder cut with more dwell either side.
const CROSSFADE = 0.08;

/* ---- the silhouette mask -------------------------------------------

   The pinned viewport is stencilled through the BONGOMAN figure, which
   grows to open the section and shrinks to close it. A CSS mask whose
   mask-size is driven by scroll: where the SVG has ink the section
   shows, where it is transparent the section is hidden, and once the
   figure is big enough to cover everything the mask is switched off.

   ONE CONTROL, NOT TWO. mask-position sets both where the figure sits
   and what it grows from, because with a mask they are the same point.
   A true anchor point, movable without moving the figure, needs the
   shape scaled by a TRANSFORM rather than grown by mask-size, which
   means an SVG clip path. That was tried and is not in this version.
   --mask-anchor-x in World.css therefore moves both at once.

   PLACEHOLDER: /images/masks/bongoman-figure.svg is traced from a 447px
   reference PNG, so its outline is only as smooth as that source. A
   proper vector export drops in at the same path with no code change,
   but COVER_BY_ASPECT below is MEASURED FROM THIS EXACT FILE and has to
   be measured again if the shape changes. */
const MASK_URL = 'url("/images/masks/bongoman-figure.svg")';

// Where opening and closing happen within the pinned scroll. Between
// OPEN_END and CLOSE_START the section is fully open and the three
// stages play out. Widen that gap to give the stages more room.
const OPEN_START = 0.05;
const OPEN_END = 0.24;
const CLOSE_START = 0.76;
const CLOSE_END = 0.95;

// Resting size of the silhouette, as a fraction of the viewport's
// larger dimension.
const MASK_MIN_FRACTION = 0.34;

/* The largest rectangle that fits ENTIRELY inside the silhouette, at a
   range of screen shapes. The value is the mask-size needed, as a
   multiple of viewport width, for the figure's body to cover the
   section.

   Measured rather than derived. A rounded rectangle has a formula; a
   running figure with thin limbs does not. A tall phone needs 8.8x and
   a wide desktop 3.7x, and getting it wrong shows up as a flash of the
   section edge at the moment the mask switches off. */
const COVER_BY_ASPECT = [
  [0.40, 8.77], [0.50, 7.41], [0.65, 5.92], [0.80, 5.43], [1.00, 5.13],
  [1.33, 5.05], [1.60, 4.93], [1.78, 4.72], [2.20, 3.89], [2.60, 3.66],
];

function coverSize(w, h) {
  const a = w / h;
  const t = COVER_BY_ASPECT;
  let mult = t[t.length - 1][1];
  if (a <= t[0][0]) {
    mult = t[0][1];
  } else {
    for (let i = 1; i < t.length; i += 1) {
      if (a <= t[i][0]) {
        const [a0, m0] = t[i - 1];
        const [a1, m1] = t[i];
        mult = m0 + ((m1 - m0) * (a - a0)) / (a1 - a0);
        break;
      }
    }
  }
  // A hair over, so an antialiased edge never shows in the switch to no
  // mask at all.
  return w * mult * 1.02;
}

// Slow start, slow landing. The landing is the part that matters: the
// growth ends exactly where the figure covers the section, so the
// slowdown is visible rather than happening off the edges of the screen.
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// 0 = small silhouette, 1 = fully open.
function maskGrowth(p) {
  if (p <= OPEN_START || p >= CLOSE_END) return 0;
  if (p < OPEN_END) return easeInOutCubic((p - OPEN_START) / (OPEN_END - OPEN_START));
  if (p <= CLOSE_START) return 1;
  return 1 - easeInOutCubic((p - CLOSE_START) / (CLOSE_END - CLOSE_START));
}

// Stage 0 never fades: it is the floor everything else covers up.
// Every later stage goes 0 to 1 across its handover window and stays
// there. useTransform clamps outside the range, so "stays there" needs
// no extra keyframes.
function stageFade(i, n) {
  if (i === 0) return { range: [0, 1], values: [1, 1] };
  const boundary = i / n;
  const half = CROSSFADE / 2;
  return { range: [boundary - half, boundary + half], values: [0, 1] };
}

/* THE COPY NEEDS THE OPPOSITE SHAPE TO THE ARTWORK.

   stageFade above is a STACK: stage 0 is permanently opaque and every
   later stage piles on top of it. That is right for artwork, because an
   opaque image hides the one underneath and no background can show
   through at any scroll position.

   It is wrong for text. Text is transparent, so it does not hide what
   is beneath it, it superimposes. Sharing the stack curve put all three
   captions on screen at once, printed over each other.

   So the copy gets a peak: up at the start of its own segment, down at
   the end, exactly one legible at a time. */
function copyFade(i, n) {
  const half = CROSSFADE / 2;
  const open = i / n;
  const close = (i + 1) / n;

  if (i === 0) return { range: [0, close - half, close + half], values: [1, 1, 0] };
  if (i === n - 1) return { range: [open - half, open + half, 1], values: [0, 1, 1] };
  return { range: [open - half, open + half, close - half, close + half], values: [0, 1, 1, 0] };
}

// The dots want that same peak, floored so an unlit dot still shows that
// it is there. Derived from copyFade rather than written out again: two
// copies of this shape is how the captions and the artwork drifted apart
// in the first place.
function dotFade(i, n) {
  const fade = copyFade(i, n);
  return { range: fade.range, values: fade.values.map((v) => 0.25 + v * 0.75) };
}

// Each stage/dot is its own component so useTransform is called once per
// component instance, not inside a loop in the parent (keeps the hook call
// order stable across renders, which is what React's rules require).
function WorldStage({ stage, index, total, scrollYProgress }) {
  const fade = stageFade(index, total);
  const opacity = useTransform(scrollYProgress, fade.range, fade.values);

  // The artwork stacks, the copy peaks. See copyFade for why one curve
  // cannot serve both.
  const copy = copyFade(index, total);
  const copyOpacity = useTransform(scrollYProgress, copy.range, copy.values);

  return (
    <motion.div className={`world__stage world__stage--${stage.key}`} style={{ opacity }}>
      <div className="world__stage-shapes" aria-hidden="true" />
      <motion.div className="container world__stage-copy" style={{ opacity: copyOpacity }}>
        <span className="world__stage-label">{stage.label}</span>
        <p>{stage.text}</p>
      </motion.div>
    </motion.div>
  );
}

function WorldDot({ index, total, scrollYProgress }) {
  const fade = dotFade(index, total);
  const opacity = useTransform(scrollYProgress, fade.range, fade.values);
  return <motion.span className="world__dot" style={{ opacity }} />;
}

export default function World() {
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });

  const reduceMotion = useReducedMotion();

  /* The mask opens, the stages play, the mask closes. All three read the
     same scroll progress through different windows, so there is ONE
     scroll listener rather than two fighting over the same distance.

     THE STAGES ARE REMAPPED. They used to run across the whole track.
     Now they run across the open window only, stretched back to 0..1,
     which means stageFade, copyFade and dotFade need no changes at all. */
  const stageProgress = useTransform(scrollYProgress, [OPEN_END, CLOSE_START], [0, 1]);

  // Measured once and on resize, not inside the transform below, which
  // runs on every frame of the scroll.
  const dimsRef = useRef(null);
  if (!dimsRef.current) {
    const w = typeof window === "undefined" ? 1440 : window.innerWidth;
    const h = typeof window === "undefined" ? 900 : window.innerHeight;
    dimsRef.current = { min: MASK_MIN_FRACTION * Math.max(w, h), cover: coverSize(w, h) };
  }

  useEffect(() => {
    const measure = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      dimsRef.current = { min: MASK_MIN_FRACTION * Math.max(w, h), cover: coverSize(w, h) };
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const growth = useTransform(scrollYProgress, maskGrowth);
  const maskSize = useTransform(growth, (g) => {
    const { min, cover } = dimsRef.current;
    const s = min + (cover - min) * g;
    return `${s}px ${s}px`;
  });

  // Fully open means NO MASK AT ALL rather than a stencil several times
  // the size of the screen. The figure already covers everything by
  // then, so the switch is invisible and the browser stops compositing
  // a mask for the rest of the section.
  const maskImage = useTransform(growth, (g) => (g >= 1 ? "none" : MASK_URL));

  // Reduced motion gets the section open and still, same as every other
  // effect on this site.
  const maskStyle = reduceMotion
    ? undefined
    : { maskImage, WebkitMaskImage: maskImage, maskSize, WebkitMaskSize: maskSize };

  return (
    <section className="world" id="world">
      {/* The intro and outro entrances used to be hand written per element,
          each with `amount: 0.6` and its own tuned `delay`. 0.6 meant the
          block waited until it was mostly on screen before it started, so
          you watched it move rather than finding it already arrived. Reveal
          triggers at 0.2 and handles the offsets between children itself,
          so adding a line here no longer means renumbering delays. */}
      <Reveal className="container world__intro" stagger={0.07}>
        <RevealItem as="p" className="eyebrow world__eyebrow">
          The World
        </RevealItem>
        <RevealItem as="h2" className="world__heading">
          From the familiar to the unknown.
        </RevealItem>
      </Reveal>

      <div className="world__scrollzone" ref={scrollRef}>
        <motion.div className="world__sticky" style={maskStyle}>
          {/* Source order IS stacking order here. Every stage is
              absolutely positioned at the same inset, so a later one
              paints over an earlier one, which is what lets the fades
              stack rather than crossfade. Reorder this list and the
              handover breaks. */}
          {stages.map((stage, i) => (
            <WorldStage key={stage.key} stage={stage} index={i} total={stages.length} scrollYProgress={stageProgress} />
          ))}

          <div className="world__progress" aria-hidden="true">
            {stages.map((stage, i) => (
              <WorldDot key={stage.key} index={i} total={stages.length} scrollYProgress={stageProgress} />
            ))}
          </div>
        </motion.div>
      </div>

      <Reveal className="container world__outro" stagger={0.08}>
        <RevealItem as="p">
          Three environments, one continuous run outward. The city he knows, then everything
          past it.
        </RevealItem>
        <RevealItem as="p" className="world__outro-emphasis comic-outline">
          Kenya, drawn by a Kenyan, playable by anyone.
        </RevealItem>
      </Reveal>
    </section>
  );
}