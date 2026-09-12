import { motion } from "framer-motion";
import "./Premise.css";

/* =========================================================
   The Premise: three cards, each with a colour panel that
   wipes up from the bottom on hover.

   Reference behaviour: the card hover on disneyanimation.com.

   THE DETAIL THAT MAKES IT WORK IS THE TIMING, NOT THE MOVE.
   The panel leads and the copy follows about 120ms behind, so
   the panel arrives and the words catch up to it. Moving them
   together is the difference between this looking expensive
   and looking like a div sliding. All of that lives in
   Premise.css, which is where the delay is set.

   Cards rather than tabs, decided earlier: three is few
   enough that showing all of them beats hiding two behind
   clicks, and nothing below them changes on interaction.
   ========================================================= */

// PLACEHOLDER: three 500x600 stand-ins in public/images/protagonist-world-goal/.
//
// From the asset manifest: keep faces and focal detail in the TOP HALF.
// The panel covers the lower part of the card, permanently so on phones,
// and art with the subject low down will have its subject sat on.
//
// PLACEHOLDER COPY, all three. The Protagonist and The Place are safe
// summaries of what the site already says elsewhere.
//
// THE GOAL IS DIFFERENT AND NEEDS YOUR DECISION. It is drawn from
// claude/game-chapter-1.md, which is still a draft nobody has signed off,
// and it puts an actual story beat on a public marketing page. Soften it
// or replace it if that is more than you want to give away before launch.
const CARDS = [
  {
    slug: "card-protagonist",
    title: "The Protagonist",
    copy: "Bongoman. A Kenyan everyman who has lived on newspaper pages since 1989. Ordinary right up until the day he cannot afford to be.",
    tone: "red",
  },
  {
    slug: "card-place",
    title: "The Place",
    copy: "Nairobi first, the Eastlands streets he already knows. Then out past them, into country he does not.",
    tone: "gold",
  },
  {
    slug: "card-goal",
    title: "The Goal",
    copy: "He was three ridges from home chasing a baboon when men came to his house. Everything after that is him trying to undo it.",
    tone: "teal",
  },
];

function Card({ slug, title, copy, tone }) {
  return (
    <article className={`premise__card premise__card--${tone}`}>
      <img
        className="premise__art"
        src={`/images/protagonist-world-goal/${slug}.png`}
        alt=""
        width="500"
        height="600"
        loading="lazy"
      />

      {/* The panel is ONE element, not a resting label plus a hover
          panel. At rest it is translated down far enough to leave only
          its title band showing, so the card is never an unlabelled
          picture, and hover pulls the same element the rest of the way
          up. One moving part instead of two crossfading.

          Set --peek to 0 in the CSS for the pure reference behaviour,
          where the card is bare artwork until you touch it. */}
      <div className="premise__panel">
        <h3 className="premise__title">{title}</h3>
        <p className="premise__copy">{copy}</p>
      </div>
    </article>
  );
}

export default function Premise() {
  return (
    <section className="premise" id="premise">
      <div className="container">
        <motion.p
          className="eyebrow premise__eyebrow"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          The Premise
        </motion.p>

        <motion.h2
          className="premise__heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Who he is. Where he is. What he wants.
        </motion.h2>

        <motion.div
          className="premise__grid"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        >
          {CARDS.map((card) => (
            <motion.div
              key={card.slug}
              variants={{
                hidden: { opacity: 0, y: 28 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
              }}
            >
              <Card {...card} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}