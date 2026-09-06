import { motion } from "framer-motion";
import StoreButtons from "./StoreButtons.jsx";
import SocialLinks from "./SocialLinks.jsx";
import "./Cta.css";

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

      <footer className="cta__footer">
        <div className="container cta__footer-inner">
          <span>BONGOMAN, created by James &ldquo;Kham&rdquo; Kamawira. Developed by Mathew Omolo.</span>
          <span>© 2026 BONGOMAN. All rights reserved.</span>
        </div>
      </footer>
    </section>
  );
}