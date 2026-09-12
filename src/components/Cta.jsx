import { motion } from "framer-motion";
import StoreButtons from "./StoreButtons.jsx";
import SocialLinks from "./SocialLinks.jsx";
import "./Cta.css";

// The site footer used to be the last thing in this file. It moved to
// Footer.jsx, because a footer nested inside a section renders wherever
// that section renders, and the moment the merchandise marquee was added
// after the CTA the footer ended up in the middle of the page.
export default function Cta() {
  return (
    <section className="cta" id="join">
      <div className="halftone cta__halftone" />
      <div className="container cta__inner">
        <motion.p
          className="eyebrow cta__eyebrow"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5 }}
        >
          Coming Soon
        </motion.p>

        <motion.h2
          className="cta__heading comic-outline"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, delay: 0.05 }}
        >
          He&rsquo;s about to move.
        </motion.h2>

        <motion.p
          className="cta__sub"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Android first, Steam after. Wishlist it, follow along, and you will know the day
          it drops.
        </motion.p>

        <motion.div
          className="cta__actions"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <StoreButtons size="center" />
        </motion.div>

        <motion.div
          className="cta__community"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="cta__community-heading">Come build it with us</h3>
          <p className="cta__community-sub">
            Devlogs, early art, and first go at the demo. The WhatsApp group is where the
            actual conversation happens.
          </p>
          <SocialLinks />
        </motion.div>
      </div>
    </section>
  );
}