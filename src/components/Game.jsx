import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoopingClip from "./LoopingClip.jsx";
import "./Game.css";

// Verbs pulled straight from the media kit: "runs, jumps, climbs, fights,
// sneaks, swims and explores". Rendered as a staggered chip grid so the
// list of actions reads as motion, not just a sentence.
const abilities = ["Run", "Jump", "Climb", "Fight", "Sneak", "Swim", "Explore"];

// The clip filename is derived from the ability rather than stored in a
// separate list, the same pattern the ebook catalogue uses for its covers.
// One source of truth: rename an ability above and you rename one file.
//
// PLACEHOLDER: labelled two second loops in public/images/game-abilities/,
// H.264, 600x600, silent. Real gameplay clips drop in at the same names.
//
// MP4 rather than an animated image was a deliberate choice: H.264 does
// real motion compensation between frames, so it is far smaller than GIF
// or WebP once a clip runs past a second or two. The cost is that video
// has no usable transparency on the web. VP9-with-alpha fails on Safari
// and HEVC-with-alpha fails on Chrome, so there is no one file that works
// everywhere. Whatever background is baked into the clip is what shows.
const clipFor = (ability) => `/images/game-abilities/${ability.toLowerCase()}.mp4`;

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
                  {/* Keyed on `active` by its parent, so each tab change
                      tears this element down and builds a new one. That is
                      what makes a clip start from its first frame rather
                      than picking up wherever the previous one was.

                      Every attribute a self-playing video needs, and the
                      React `muted` gotcha that goes with them, lives in
                      LoopingClip rather than being spelled out twice.

                      No `alt` equivalent is needed: the ability name is
                      already on screen as text directly below the frame. */}
                  <LoopingClip
                    className="game__stage-clip"
                    src={clipFor(active)}
                    width="600"
                    height="600"
                  />
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