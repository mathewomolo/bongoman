import Reveal, { RevealItem } from "./Reveal.jsx";
import MellowTrail from "./MellowTrail.jsx";
import "./Mellowphant.css";

/* Split-scroll studio section.

   The left column holds still while the right column scrolls past it. That
   is `position: sticky` on the left, nothing more, so there is no scroll
   listener and no framer-motion driving the pin. The one non-obvious part
   is a grid rule in Mellowphant.css, commented there.

   PLACEHOLDER: the studio copy below is written by Claude as a stand-in
   for the real Mellowphant Games bio. Mathew owns the real words. The
   block structure survives a rewrite, so replace the strings and leave
   the shape.

   PLACEHOLDER: the one line descriptions of KUDU Rally X, Sheng 4 Pics
   and Ajua Mancala are inferred from their titles alone. Nobody has told
   Claude what these games actually are, so treat those three phrases as
   guesses to correct rather than copy to approve.

   PLACEHOLDER: /images/mellowphant/logo-mellowphant.png is the labelled
   300x300 stand-in. Real studio logo drops in at the same path and size. */

const blocks = [
  {
    heading: "A studio, not a project",
    body: "Mellowphant Games builds original games out of Nairobi. Small team, long horizons, and a preference for finishing things over announcing them.",
  },
  {
    heading: "The games so far",
    body: "KUDU Rally X, Sheng 4 Pics and Ajua Mancala. A rally racer, a word game built on Kenyan street slang, and a version of the count and capture board game played across East Africa for centuries. Different shapes, one habit: take something people here already know and make it playable.",
  },
  {
    heading: "Where BONGOMAN fits",
    body: "BONGOMAN is the studio's current build, made with James Kham Kamawira, the artist who created the character in 1989. Taking a comic that has lived on the page for decades and asking what happens when the reader gets to move him.",
  },
  {
    heading: "How the work gets made",
    body: "Art first, then the systems that let the art move. Every character is drawn before it is rigged, and every mechanic exists because something in the world needed it, rather than the other way around.",
  },
  {
    heading: "Babu is next",
    body: "Another platformer, built around Babu, a second character Kham drew for the newspapers. The same approach as BONGOMAN: start with a figure Kenyan readers already recognise, and hand them the controls. Coming soon.",
  },
];

export default function Mellowphant() {
  return (
    <section className="mellow" id="studio">
      {/* Absolutely positioned layer, so the trail clips at the section
          edge without overflow: hidden going on .mellow itself, which
          would make it the scroll container for the sticky column and
          silently kill the pin. See MellowTrail.css. */}
      <MellowTrail />

      <div className="container mellow__inner">
        {/* Stationary half. Stays put for the whole section. */}
        <div className="mellow__art">
          <div className="mellow__art-inner">
            <img
              className="mellow__logo"
              src="/images/mellowphant/logo-mellowphant.png"
              width="300"
              height="300"
              alt="Mellowphant Games"
            />
            <span className="mellow__art-caption">Mellowphant Games</span>
          </div>
        </div>

        {/* Scrolling half. */}
        <div className="mellow__copy">
          <Reveal className="mellow__lede" stagger={0.07}>
            <RevealItem as="p" className="eyebrow mellow__eyebrow">
              The Studio
            </RevealItem>
            <RevealItem as="h2" className="mellow__heading">
              Made by Mellowphant Games.
            </RevealItem>
          </Reveal>

          {blocks.map((block) => (
            <Reveal key={block.heading} className="mellow__block" stagger={0.06}>
              <RevealItem as="h3" className="mellow__block-heading">
                {block.heading}
              </RevealItem>
              <RevealItem as="p" className="mellow__block-body">
                {block.body}
              </RevealItem>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}