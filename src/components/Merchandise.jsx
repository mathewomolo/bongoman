import { motion } from "framer-motion";
import "./Merchandise.css";

/* =========================================================
   The merchandise marquee.

   HOW A SEAMLESS MARQUEE ACTUALLY WORKS
   -------------------------------------
   The list is rendered TWICE and the track slides left by
   exactly half its own width. At the moment the animation
   loops, the second copy is sitting precisely where the first
   copy started, so the jump back to zero lands on an identical
   picture and is invisible.

   This is why the duplicate is not optional and why the
   translate has to be exactly -50%. Any other figure and the
   loop visibly snaps.

   The second copy is aria-hidden, because a screen reader
   should hear eight products, not sixteen.
   ========================================================= */

// PLACEHOLDER: eight 300x350 stand-ins in public/images/merchandise/.
// Real product shots drop in at the same names with no code change.
//
// From the asset manifest, and it matters more here than anywhere else
// on the site: shoot or render all eight on a CONSISTENT background at a
// CONSISTENT product scale. A marquee puts them shoulder to shoulder,
// which is exactly where a mismatched crop or a different grey shows up.
const ITEMS = [
  { slug: "merch-tee", label: "Tee" },
  { slug: "merch-hoodie", label: "Hoodie" },
  { slug: "merch-cap", label: "Cap" },
  { slug: "merch-poster", label: "Poster" },
  { slug: "merch-mug", label: "Mug" },
  { slug: "merch-stickers", label: "Sticker pack" },
  { slug: "merch-tote", label: "Tote" },
  { slug: "merch-keyring", label: "Keyring" },
];

function Item({ slug, label, duplicate }) {
  return (
    <li className="merch__item" aria-hidden={duplicate ? "true" : undefined}>
      <div className="merch__shot">
        {/* alt is empty on purpose: the caption below already names the
            product, and a screen reader announcing "Tee" twice in a row
            is worse than announcing it once. */}
        <img src={`/images/merchandise/${slug}.png`} alt="" width="300" height="350" loading="lazy" />
      </div>
      <span className="merch__label">{label}</span>
    </li>
  );
}

export default function Merchandise() {
  return (
    <section className="merch" id="merch">
      <div className="container">
        <motion.p
          className="eyebrow merch__eyebrow"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          Merch
        </motion.p>

        <motion.h2
          className="merch__heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Bongoman, off the page.
        </motion.h2>
      </div>

      {/* OUTSIDE .container deliberately. A marquee that stops at the
          1180px text column has two visible hard edges in the middle of
          the screen and reads as a widget. Running it the full width of
          the viewport is what makes it read as a passing conveyor. */}
      <div className="merch__rail">
        <ul className="merch__track">
          {ITEMS.map((item) => (
            <Item key={item.slug} {...item} />
          ))}
          {ITEMS.map((item) => (
            <Item key={`${item.slug}-copy`} {...item} duplicate />
          ))}
        </ul>
      </div>
    </section>
  );
}