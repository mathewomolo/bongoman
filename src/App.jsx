import { MotionConfig } from "framer-motion";
import Hero from "./components/Hero.jsx";
import StoryFeed from "./components/StoryFeed.jsx";
import Story from "./components/Story.jsx";
import Game from "./components/Game.jsx";
import World from "./components/World.jsx";
import Ebooks from "./components/Ebooks.jsx";
import Mellowphant from "./components/Mellowphant.jsx";
import Cta from "./components/Cta.jsx";
import CustomCursor from "./components/CustomCursor.jsx";
import SiteNav from "./components/SiteNav.jsx";

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
        <Ebooks />
        {/* Studio section sits after the product sections and before the
            CTA, so the reader meets who made it once they already care,
            and the store buttons still get the last word. */}
        <Mellowphant />
        <Cta />
      </main>
      {/* Fixed-position, renders on top of everything and never blocks
          clicks (pointer-events: none). Safe to mount once here rather
          than per-section. */}
      <CustomCursor />
    </MotionConfig>
  );
}