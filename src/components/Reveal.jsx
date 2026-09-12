import { motion } from "framer-motion";

/* =========================================================
   Reveal: the shared scroll-entrance primitive.

   WHY THIS EXISTS
   ---------------
   The same four lines were hand written at every entrance in
   the site:

     initial={{ opacity: 0, y: 16 }}
     whileInView={{ opacity: 1, y: 0 }}
     viewport={{ once: true, amount: 0.6 }}
     transition={{ duration: 0.5 }}

   Repeating it meant every entrance was identical, and it meant
   one bad number was copied everywhere. That number was
   `amount: 0.6`, which tells framer to wait until 60% of the
   element is on screen before starting. On anything taller than
   a heading you are already looking straight at it when it
   starts to move, so the motion reads as the page lagging
   rather than the content arriving. `amount` here defaults to
   0.2, so a block starts its entrance as it comes in and has
   finished by the time it is in front of you.

   The second reason it exists is stagger. Moving a whole
   section as one lump is the thing that looks cheap. Letting a
   heading land, then its paragraph, then each card in turn, is
   what reads as choreography. Doing that by hand meant tuning a
   `delay` per element, which does not survive adding a card.

   REDUCED MOTION
   --------------
   Nothing special needed here. `MotionConfig reducedMotion="user"`
   in App.jsx strips the transform half and keeps the opacity
   half, so these entrances become plain fades for anyone who
   asked their OS for less movement.

   USAGE
   -----
   One element:

     <Reveal>
       <h2>From the familiar to the unknown.</h2>
     </Reveal>

   A staggered set. Reveal becomes the container and stops
   animating itself, the items do the moving:

     <Reveal stagger={0.07} className="cards">
       <RevealItem><Card /></RevealItem>
       <RevealItem><Card /></RevealItem>
     </Reveal>

   Because Reveal is the element that carries your className, it
   can be the grid or flex container itself. RevealItem children
   stay direct children of it, so no wrapper div gets inserted
   between your layout and its items.
   ========================================================= */

// Ease out with a long tail. Fast to leave, slow to settle, which is
// what makes a short travel distance still read as deliberate.
const EASE = [0.22, 1, 0.36, 1];

// Travel stays small on purpose. Long travel reads as "an animation
// played". Sixteen to twenty-four pixels reads as "this arrived".
const DEFAULT_DISTANCE = 20;

function offsetFor(direction, distance) {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    case "none":
      return {};
    default:
      return { y: distance };
  }
}

/* The tags `as` can resolve to, looked up rather than computed.

   This was a `tagFor(as)` helper returning `motion[as]`, which tripped
   oxlint's react(static-components) rule twice: a component produced by
   a function call during render is normally a new component every
   render, and React throws away its state each time. That was a false
   alarm here, because `motion.div` and friends are stable references
   that framer-motion creates once, but the linter cannot tell the
   difference between a lookup and a construction when it is wrapped in
   a call.

   A plain object read is unambiguous to both the linter and the next
   reader. The trade is that `as` now has to be a tag on this list, so
   adding one means adding a line here. That is a feature: a typo in
   `as` silently fell back to a div before, and now it still does, but
   the list tells you what was actually available. */
const TAGS = {
  div: motion.div,
  span: motion.span,
  p: motion.p,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  ul: motion.ul,
  li: motion.li,
  section: motion.section,
  a: motion.a,
};

export default function Reveal({
  as = "div",
  direction = "up",
  distance = DEFAULT_DISTANCE,
  delay = 0,
  duration = 0.45,
  stagger = 0,
  amount = 0.2,
  once = true,
  className,
  children,
  ...rest
}) {
  const Tag = TAGS[as] ?? TAGS.div;
  const isContainer = stagger > 0;

  // As a container it orchestrates and stays visible itself, otherwise
  // a wrapper fading in would fade its children in a second time.
  const variants = isContainer
    ? {
        hidden: {},
        shown: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }
    : {
        hidden: { opacity: 0, ...offsetFor(direction, distance) },
        shown: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration, delay, ease: EASE },
        },
      };

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once, amount }}
      variants={variants}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* A child of a staggered Reveal. It deliberately sets no `initial` or
   `whileInView` of its own: framer propagates the parent's variant name
   down to any child that declares matching variants, and a child that
   re-declares whileInView would start its own independent timer and
   break the stagger. */
export function RevealItem({
  as = "div",
  direction = "up",
  distance = DEFAULT_DISTANCE,
  duration = 0.45,
  className,
  children,
  ...rest
}) {
  const Tag = TAGS[as] ?? TAGS.div;

  return (
    <Tag
      className={className}
      variants={{
        hidden: { opacity: 0, ...offsetFor(direction, distance) },
        shown: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration, ease: EASE },
        },
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}