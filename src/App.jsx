import { MotionConfig } from "framer-motion";
import Hero from "./components/Hero.jsx";
import StoryFeed from "./components/StoryFeed.jsx";
import Story from "./components/Story.jsx";
import Game from "./components/Game.jsx";
import World from "./components/World.jsx";
import ComicStrip from "./components/ComicStrip.jsx";
import Ebooks from "./components/Ebooks.jsx";
import Premise from "./components/Premise.jsx";
import Mellowphant from "./components/Mellowphant.jsx";
import Cta from "./components/Cta.jsx";
import Merchandise from "./components/Merchandise.jsx";
import CustomCursor from "./components/CustomCursor.jsx";
import SiteNav from "./components/SiteNav.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  return (
    // `reducedMotion="user"` makes every framer-motion animation in the
    // tree check the visitor's OS "reduce motion" setting. Transform and
    // layout animations (the parallax, the card scaling, the drifting
    // figures) are skipped for those users while opacity fades still
    // play, so the site stays legible instead of going static. The CSS
    // half of this lives in index.css.
    <MotionConfig reducedMotion="user">
      <SiteNav />
      <main id="main">
        <Hero />
        <StoryFeed />
        <Story />
        <Game />
        <World />
        {/* The weekly strip sits directly above the ebooks. It is the
            free sample and the catalogue is the thing you buy, so
            sample first, catalogue second. */}
        <ComicStrip />
        <Ebooks />
        {/* The three hover cards. Placed here rather than before The
            World, which is where the original spec put them, because a
            card called The Place reading as the lead in to a section
            called The World only works if it sits next to it. Here it
            introduces who and why immediately before the studio section
            explains who built it. */}
        <Premise />
        {/* Studio section sits after the product sections and before the
            CTA, so the reader meets who made it once they already care. */}
        <Mellowphant />
        <Cta />
        {/* Merchandise comes AFTER the CTA rather than before it. The
            store buttons no longer get the literal last word, which was
            the old reason for this order, but a marquee placed above
            them would sit between someone deciding and someone acting.
            Merch is the thing you browse once the decision is made. */}
        <Merchandise />
      </main>
      {/* OUTSIDE <main>, which is what the element is for: a site
          footer is not main content. And last, so that adding another
          section never pushes it up the page again, which is exactly
          what happened when it lived inside Cta. */}
      <Footer />
      {/* Fixed-position, renders on top of everything and never blocks
          clicks (pointer-events: none). Safe to mount once here rather
          than per-section. */}
      <CustomCursor />
    </MotionConfig>
  );
}