import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./Game.css";

// Verbs pulled straight from the media kit: "runs, jumps, climbs, fights,
// sneaks, swims and explores". Rendered as a staggered chip grid so the
// list of actions reads as motion, not just a sentence.
const abilities = ["Run", "Jump", "Climb", "Fight", "Sneak", "Swim", "Explore"];

// PLACEHOLDER: each ability shows a simple stroke pose standing in for a
// real gameplay GIF of Bongoman performing that action, since no capture
// footage exists yet. Once real GIFs are ready, replace AbilityPose's
// switch below with an <img> or <video> per key. Poses share Story.jsx's
// stick-figure style (circle head, stroked limbs, same viewBox) so the
// placeholder art reads as one consistent set rather than a mismatch.
function AbilityPose({ pose }) {
  const stroke = { stroke: "#ffffff", strokeWidth: 10, strokeLinecap: "round" };
  switch (pose) {
    case "Jump":
      return (
        <svg viewBox="0 0 200 320" fill="none" aria-hidden="true">
          <circle cx="100" cy="60" r="36" {...stroke} />
          <path d="M100 96 L100 190" {...stroke} />
          <path d="M100 120 L45 80" {...stroke} />
          <path d="M100 120 L155 80" {...stroke} />
          <path d="M100 190 L70 260" {...stroke} />
          <path d="M100 190 L130 250" {...stroke} />
        </svg>
      );
    case "Climb":
      return (
        <svg viewBox="0 0 200 320" fill="none" aria-hidden="true">
          <circle cx="110" cy="60" r="36" {...stroke} />
          <path d="M110 96 L95 190" {...stroke} />
          <path d="M95 130 L150 50" {...stroke} />
          <path d="M95 130 L40 150" {...stroke} />
          <path d="M95 190 L50 220" {...stroke} />
          <path d="M95 190 L120 270" {...stroke} />
        </svg>
      );
    case "Fight":
      return (
        <svg viewBox="0 0 200 320" fill="none" aria-hidden="true">
          <circle cx="80" cy="60" r="36" {...stroke} />
          <path d="M80 96 L85 190" {...stroke} />
          <path d="M85 130 L170 110" {...stroke} />
          <path d="M85 130 L30 170" {...stroke} />
          <path d="M85 190 L55 270" {...stroke} />
          <path d="M85 190 L120 260" {...stroke} />
        </svg>
      );
    case "Sneak":
      return (
        <svg viewBox="0 0 200 320" fill="none" aria-hidden="true">
          <circle cx="130" cy="110" r="34" {...stroke} />
          <path d="M130 144 L90 190" {...stroke} />
          <path d="M90 165 L150 155" {...stroke} />
          <path d="M90 165 L40 190" {...stroke} />
          <path d="M90 190 L60 240" {...stroke} />
          <path d="M90 190 L130 250" {...stroke} />
        </svg>
      );
    case "Swim":
      return (
        <svg viewBox="0 0 200 320" fill="none" aria-hidden="true">
          <circle cx="150" cy="140" r="32" {...stroke} />
          <path d="M150 172 L90 180" {...stroke} />
          <path d="M90 180 L20 140" {...stroke} />
          <path d="M90 180 L30 220" {...stroke} />
          <path d="M90 180 L40 235" {...stroke} />
          <path d="M90 180 L20 245" {...stroke} />
        </svg>
      );
    case "Explore":
      return (
        <svg viewBox="0 0 200 320" fill="none" aria-hidden="true">
          <circle cx="90" cy="60" r="36" {...stroke} />
          <path d="M90 96 L90 190" {...stroke} />
          <path d="M90 120 L140 70" {...stroke} />
          <path d="M90 120 L40 140" {...stroke} />
          <path d="M90 190 L60 270" {...stroke} />
          <path d="M90 190 L120 270" {...stroke} />
        </svg>
      );
    default:
      // Run
      return (
        <svg viewBox="0 0 200 320" fill="none" aria-hidden="true">
          <circle cx="90" cy="55" r="38" {...stroke} />
          <path d="M90 92 L70 180" {...stroke} />
          <path d="M70 130 L20 170" {...stroke} />
          <path d="M70 130 L140 110" {...stroke} />
          <path d="M70 180 L40 280" {...stroke} />
          <path d="M70 180 L130 260" {...stroke} />
        </svg>
      );
  }
}

const gridVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const chipVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function Game() {
  const [active, setActive] = useState("Run");
  // The default pose counts as already seen, so "Run" starts visited too.
  const [visited, setVisited] = useState(() => new Set(["Run"]));

  const selectAbility = (ability) => {
    setActive(ability);
    setVisited((prev) => new Set(prev).add(ability));
  };

  return (
    <section className="game" id="game">
      <div className="halftone game__halftone" />
      <div className="container">
        <motion.p
          className="eyebrow game__eyebrow"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5 }}
        >
          The Game
        </motion.p>

        <motion.h2
          className="game__heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Seven ways through Nairobi.
        </motion.h2>

        <div className="game__layout">
          <div className="game__intro">
            <motion.p
              className="game__lede"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              BONGOMAN is a 2D action platformer set in a stylized Kenya. It opens in the
              streets of Nairobi and works outward into the country beyond. You run, jump,
              climb, fight, sneak, swim and explore your way through it, and most of the game
              is about picking the right one at the right moment.
            </motion.p>

            <motion.div
              className="game__abilities"
              variants={gridVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
            >
              {abilities.map((ability) => {
                const isActive = ability === active;
                const isVisited = visited.has(ability) && !isActive;
                const className = [
                  "game__chip",
                  isActive && "game__chip--active",
                  isVisited && "game__chip--visited",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <motion.button
                    type="button"
                    key={ability}
                    className={className}
                    variants={chipVariants}
                    onClick={() => selectAbility(ability)}
                    aria-pressed={isActive}
                  >
                    {ability}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          <motion.div
            className="game__stage"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="game__stage-frame">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  className="game__stage-pose"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <AbilityPose pose={active} />
                </motion.div>
              </AnimatePresence>
            </div>
            <span className="game__stage-label">{active}</span>
          </motion.div>
        </div>

        <motion.blockquote
          className="game__quote"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6 }}
        >
          <span className="comic-outline">
            For over thirty years you read what Bongoman did. Now you decide.
          </span>
        </motion.blockquote>

        <motion.p
          className="game__closer"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5 }}
        >
          It plays like the platformers you grew up on, in a place and with a character you
          probably did not see in them. Android first, Steam after.
        </motion.p>
      </div>
    </section>
  );
}
