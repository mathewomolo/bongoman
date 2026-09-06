import { motion } from "framer-motion";
import EbookCatalogue from "./EbookCatalogue.jsx";
import "./Ebooks.css";

const steps = ["Read it.", "Discover it.", "Play it."];

// PLACEHOLDER: flat colored spines stand in for real illustrated book
// covers once Mathew exports art for the in-game collectibles.
const spineColors = ["var(--color-gold)", "var(--color-action-red)", "var(--color-savanna)"];

export default function Ebooks() {
  return (
    <section className="ebooks" id="books">
      <div className="container">
        <motion.p
          className="eyebrow ebooks__eyebrow"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5 }}
        >
          Ebooks
        </motion.p>

        <motion.h2
          className="ebooks__heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          The world doesn&rsquo;t end when the level does.
        </motion.h2>

        <div className="ebooks__layout">
          <motion.div
            className="ebooks__spines"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          >
            {spineColors.map((color, i) => (
              <motion.div
                key={i}
                className="ebooks__spine"
                style={{ background: color }}
                variants={{
                  hidden: { opacity: 0, y: 30, rotate: -6 + i * 6 },
                  show: { opacity: 1, y: 0, rotate: -4 + i * 4, transition: { duration: 0.5, ease: "easeOut" } },
                }}
              />
            ))}
          </motion.div>

          <div className="ebooks__text">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5 }}
            >
              Hidden through the game are Kham&rsquo;s actual books. Find one and it opens
              right there on your phone, a full comic to read before you go back to whatever
              you were climbing.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              The books are also where the game is headed. Later levels come straight out of
              these stories, so what you read now is what you will be playing later.
            </motion.p>
          </div>
        </div>

        <motion.div
          className="ebooks__steps"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
        >
          {steps.map((step, i) => (
            <motion.span
              key={step}
              className="ebooks__step"
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            >
              {step}
              {i < steps.length - 1 && <span className="ebooks__arrow" aria-hidden="true">&#8594;</span>}
            </motion.span>
          ))}
        </motion.div>

        <EbookCatalogue />
      </div>
    </section>
  );
}
