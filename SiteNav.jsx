import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./SiteNav.css";

const LINKS = [
  { href: "#story", label: "Story" },
  { href: "#game", label: "Game" },
  { href: "#world", label: "World" },
  { href: "#books", label: "Books" },
];

export default function SiteNav() {
  const [past, setPast] = useState(false);

  useEffect(() => {
    // Convention: the bar stays out of the way over the hero (which is
    // doing its own job and does not want a strip of chrome across it)
    // and then rides along for the remaining eight-odd screens. The
    // point is that the call to action is never more than a glance
    // away once someone has committed to scrolling.
    const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* First thing in the tab order, visible only once focused: lets a
          keyboard or screen-reader user jump the whole nav and get
          straight to the page. Standard practice, invisible to everyone
          else. */}
      <a className="skiplink" href="#main">
        Skip to content
      </a>

      <motion.header
        className="sitenav"
        initial={false}
        animate={{ y: past ? 0 : -96, opacity: past ? 1 : 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        aria-hidden={past ? undefined : true}
      >
        <div className="container sitenav__inner">
          <a className="sitenav__mark" href="#top">
            BONGOMAN
          </a>

          <nav className="sitenav__links" aria-label="Sections">
            {LINKS.map((link) => (
              <a key={link.href} className="sitenav__link" href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          {/* Both stores are still coming, so the standing action is the
              one thing someone can actually do today. A nav CTA that
              leads somewhere real beats a prettier one that does not. */}
          <a className="sitenav__cta" href="#join">
            Join
          </a>
        </div>
      </motion.header>
    </>
  );
}