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

// Builds a [0,1] scroll-progress curve for a stage at index i out of n,
// with a soft crossfade overlap into its neighbors.
function stageRange(i, n) {
  const span = 1 / n;
  const start = i * span;
  const end = start + span;
  const fade = span * 0.35;
  if (i === 0) return [start, end - fade, end];
  if (i === n - 1) return [start, start + fade, end];
  return [start, start + fade, end - fade, end];
}
function stageOpacityValues(i, n) {
  if (i === 0) return [1, 1, 0];
  if (i === n - 1) return [0, 1, 1];
  return [0, 1, 1, 0];
}

// Each stage/dot is its own component so useTransform is called once per
// component instance, not inside a loop in the parent (keeps the hook call
// order stable across renders, which is what React's rules require).
function WorldStage({ stage, index, total, scrollYProgress }) {
  const opacity = useTransform(scrollYProgress, stageRange(index, total), stageOpacityValues(index, total));
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
  const raw = stageOpacityValues(index, total).map((v) => 0.25 + v * 0.75);
  const opacity = useTransform(scrollYProgress, stageRange(index, total), raw);
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