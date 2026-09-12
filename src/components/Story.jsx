import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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

// PLACEHOLDER: FigureLeft and FigureRight are simple stroke stick figures
// standing in for real illustrated Bongoman character art. They sit in the
// side margins outside the text column on purpose (not centered over it),
// so the scroll-linked float below can move them without ever crossing
// over the copy, at any scroll position.
function FigureLeft() {
  return (
    <svg viewBox="0 0 200 320" fill="none" aria-hidden="true">
      <circle cx="90" cy="55" r="38" stroke="#ffffff" strokeWidth="10" />
      <path d="M90 92 L70 180" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
      <path d="M70 130 L20 170" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
      <path d="M70 130 L140 110" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
      <path d="M70 180 L40 280" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
      <path d="M70 180 L130 260" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}

function FigureRight() {
  return (
    <svg viewBox="0 0 200 320" fill="none" aria-hidden="true">
      <text x="140" y="50" fontFamily="var(--font-display)" fontSize="48" fill="#ffffff">
        ?
      </text>
      <circle cx="90" cy="110" r="38" stroke="#ffffff" strokeWidth="10" />
      <path d="M90 148 L90 230" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
      <path d="M90 170 L30 150" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
      <path d="M90 170 L150 190" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
      <path d="M90 230 L60 300" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
      <path d="M90 230 L120 300" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}

export default function Story() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Both figures fade in, float upward at different speeds (the speed
  // difference is what reads as parallax depth), then fade out before
  // the section ends, rather than just appearing and disappearing.
  const figureLeftY = useTransform(scrollYProgress, [0, 1], [40, -180]);
  const figureLeftOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const figureRightY = useTransform(scrollYProgress, [0, 1], [20, -260]);
  const figureRightOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);

  return (
    <section className="story" id="story" ref={sectionRef}>
      <motion.div className="story__figure story__figure--left" style={{ y: figureLeftY, opacity: figureLeftOpacity }}>
        <FigureLeft />
      </motion.div>
      <motion.div className="story__figure story__figure--right" style={{ y: figureRightY, opacity: figureRightOpacity }}>
        <FigureRight />
      </motion.div>

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