import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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

/* =========================================================
   HOW THE STAGES HAND OVER, AND WHY IT CHANGED

   THE OLD VERSION HAD A HOLE IN IT.
   Each stage owned a third of the track and faded out inside
   its own third, and the next one only began rising where the
   previous one had already finished. At progress 0.333 every
   stage was at opacity 0 and you saw the bare section
   background through the gap. It was a fade out followed by a
   fade in, not a crossfade.

   It also gave the MIDDLE stage almost no hold. Working the
   old numbers through: stage one held for 22% of the track,
   stage three for 22%, and stage two for 10%. Ten percent of
   80vh of travel is about 8vh, which is a flick. That is why
   scrolling quickly looked like it jumped from one to three.

   THE NEW VERSION STACKS INSTEAD OF CROSSFADING.
   Stage one is simply always opaque. Each later stage fades in
   OVER the one below it and then stays. Because there is
   always a fully opaque layer underneath, there is no moment
   when the background can show through, which no amount of
   overlapping two fading layers can give you: two images at
   50% each still let 25% of whatever is behind them through.

   Stacking works because the stages are absolutely positioned
   siblings in source order, so a later one paints over an
   earlier one for free.

   NOW EVERY STAGE HOLDS.
   With CROSSFADE at 0.08, the handovers happen in two short
   windows and the rest of the track is flat:

     stage 1 alone   0      to 0.293
     handover               0.293 to 0.373
     stage 2 alone   0.373  to 0.627
     handover               0.627 to 0.707
     stage 3 alone   0.707  to 1

   Roughly 29%, 25%, 29% held, versus 22/10/22 before.
   ========================================================= */

// How much of the scroll track is spent moving between two stages. The
// rest is hold. Raise it for a longer, softer transition; lower it for a
// harder cut with more dwell either side.
const CROSSFADE = 0.08;

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

// The dots want the opposite shape: a peak, so exactly one reads as
// current. They are indicators rather than artwork, so a brief moment
// where two sit half lit during a handover is correct.
function dotFade(i, n) {
  const half = CROSSFADE / 2;
  const open = i / n;
  const close = (i + 1) / n;

  let range;
  let values;
  if (i === 0) {
    range = [0, close - half, close + half];
    values = [1, 1, 0];
  } else if (i === n - 1) {
    range = [open - half, open + half, 1];
    values = [0, 1, 1];
  } else {
    range = [open - half, open + half, close - half, close + half];
    values = [0, 1, 1, 0];
  }

  // Never fully dark: an unlit dot still has to show that it is there.
  return { range, values: values.map((v) => 0.25 + v * 0.75) };
}

// Each stage/dot is its own component so useTransform is called once per
// component instance, not inside a loop in the parent (keeps the hook call
// order stable across renders, which is what React's rules require).
function WorldStage({ stage, index, total, scrollYProgress }) {
  const fade = stageFade(index, total);
  const opacity = useTransform(scrollYProgress, fade.range, fade.values);
  return (
    <motion.div className={`world__stage world__stage--${stage.key}`} style={{ opacity }}>
      <div className="world__stage-shapes" aria-hidden="true" />
      <div className="container world__stage-copy">
        <span className="world__stage-label">{stage.label}</span>
        <p>{stage.text}</p>
      </div>
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
        <div className="world__sticky">
          {/* Source order IS stacking order here. Every stage is
              absolutely positioned at the same inset, so a later one
              paints over an earlier one, which is what lets the fades
              stack rather than crossfade. Reorder this list and the
              handover breaks. */}
          {stages.map((stage, i) => (
            <WorldStage key={stage.key} stage={stage} index={i} total={stages.length} scrollYProgress={scrollYProgress} />
          ))}

          <div className="world__progress" aria-hidden="true">
            {stages.map((stage, i) => (
              <WorldDot key={stage.key} index={i} total={stages.length} scrollYProgress={scrollYProgress} />
            ))}
          </div>
        </div>
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