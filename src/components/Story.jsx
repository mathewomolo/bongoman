import { motion } from "framer-motion";
import LoopingClip from "./LoopingClip.jsx";
import "./Story.css";

const panelVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

// PLACEHOLDER: two labelled 500x500 loops in public/images/story/. Real
// gameplay clips drop in at the same names with no code change.
const CLIPS = [
  { src: "/images/story/story-1.mp4", side: "left" },
  { src: "/images/story/story-2.mp4", side: "right" },
];

// PLACEHOLDER: 350x350 stand-ins in public/images/story/. Real photographs
// belong here rather than illustrations. This section's whole claim is
// that two actual people made this, and a photograph is the evidence.
const KHAM_PORTRAIT = "/images/story/kham.png";
const MATHEW_PORTRAIT = "/images/story/mathew.png";

export default function Story() {
  return (
    <section className="story" id="story">
      <div className="container">
        <motion.p
          className="eyebrow story__eyebrow"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5 }}
        >
          Origin Story
        </motion.p>

        <motion.h2
          className="story__heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Two creators.
          <br />
          One hero.
        </motion.h2>

        <div className="story__panels">
          <motion.article
            className="story__panel story__panel--page"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.35 }}
            variants={{
              hidden: { opacity: 0, x: -50, rotate: 0 },
              show: { opacity: 1, x: 0, rotate: -1.5, transition: { duration: 0.7, ease: "easeOut" } },
            }}
          >
            {/* Outside .story__panel-body on purpose. The body keeps
                `overflow: hidden` so the giant year watermark can bleed off
                its top edge, and anything inside it that overhangs the
                panel would be sliced off by that same rule. Sitting out
                here, the portrait can overlap the corner. */}
            <img
              className="story__portrait story__portrait--left"
              src={KHAM_PORTRAIT}
              width="350"
              height="350"
              alt="James Kham Kamawira"
            />

            <div className="story__panel-body">
              <h3 className="story__panel-label">The Page</h3>
              <p>
                James &ldquo;Kham&rdquo; Kamawira drew the first Bongoman strip for a Kenyan
                newspaper in 1989. The character outgrew the strip and moved into comic books,
                and he has been part of Kenyan comics ever since.
              </p>
            </div>
          </motion.article>

          <motion.article
            className="story__panel story__panel--play"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.35 }}
            variants={{
              hidden: { opacity: 0, x: 50, rotate: 0 },
              show: { opacity: 1, x: 0, rotate: 1.5, transition: { duration: 0.7, ease: "easeOut", delay: 0.1 } },
            }}
          >
            <img
              className="story__portrait story__portrait--right"
              src={MATHEW_PORTRAIT}
              width="350"
              height="350"
              alt="Mathew Omolo"
            />

            <div className="story__panel-body">
              <h3 className="story__panel-label">The Play</h3>
              <p>
                Mathew Omolo, a Kenyan animator, game developer and creative director, is
                building the game with Kham. Same character, same city, except now you are the
                one moving him. Which raises the obvious question.
              </p>
            </div>
          </motion.article>
        </div>
      </div>

      {/* Deliberately OUTSIDE .container. The container caps at 1180px and
          centres, which is right for reading but leaves no room for two
          500px clips either side of a column of text. This block gets its
          own wider bound so the clips can sit out in the page margins
          where the floating figures used to be, with the copy still
          holding the middle. */}
      <div className="story__finale">
        <motion.div
          className="story__clip story__clip--left"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <LoopingClip
            className="story__clip-video"
            src={CLIPS[0].src}
            width="500"
            height="500"
          />
        </motion.div>

        <div className="story__finale-text">
          <motion.blockquote
            className="story__quote"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6 }}
          >
            <span className="comic-outline">What happens when Bongoman can finally move?</span>
          </motion.blockquote>

          <motion.p
            className="story__closer"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.6 }}
            variants={panelVariants}
          >
            The answer is a 2D action platformer built out of the world Kham has drawn for
            over thirty years, rebuilt as a place you can run through, climb and fight your
            way across.
          </motion.p>
        </div>

        <motion.div
          className="story__clip story__clip--right"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        >
          <LoopingClip
            className="story__clip-video"
            src={CLIPS[1].src}
            width="500"
            height="500"
          />
        </motion.div>
      </div>
    </section>
  );
}