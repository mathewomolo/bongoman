import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import "./World.css";

// PLACEHOLDER: the three "stage" backgrounds below (gradients + the small
// scattered shapes in each) stand in for real illustrated environment art.
// The crossfade wiring (scroll progress -> opacity per stage) stays the
// same once real Nairobi/peri-urban/savanna illustrations replace them.

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
      <div className="container world__intro">
        <motion.p
          className="eyebrow world__eyebrow"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5 }}
        >
          The World
        </motion.p>
        <motion.h2
          className="world__heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          From the familiar to the unknown.
        </motion.h2>
      </div>

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

      <div className="container world__outro">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5 }}
        >
          Three environments, one continuous run outward. The city he knows, then everything
          past it.
        </motion.p>
        <motion.p
          className="world__outro-emphasis comic-outline"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Kenya, drawn by a Kenyan, playable by anyone.
        </motion.p>
      </div>
    </section>
  );
}
