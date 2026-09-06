import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "framer-motion";
import "./EbookCatalogue.css";

// Shared with both the card tint and the backdrop tint below, at a
// two-step offset from each other, so a given book's card and its
// backdrop never land on the same color.
const TINTS = ["var(--color-gold)", "var(--color-action-red)", "var(--color-savanna)", "var(--color-clay)"];

// Real titles, given directly by Mathew. Cover art is the placeholder
// part here, not the titles: he has real cover images for most of
// these but hasn't uploaded them yet, so each card is a generated
// color placeholder with the title lettered on it in the meantime.
// Swapping in real art later is a one-field change per entry (`cover`
// below), the same pattern used for World.jsx's background art.
const books = [
  "Bongoman and the magic potion",
  "Bongoman and the golden boots",
  "Bongoman and the pirates",
  "Bongoman and the warlords",
  "Bongoman strikes gold",
  "Bongoman and the aliens",
  "Bongoman tees off",
  "Bongoman the vigilante",
  "Bongoman and the mad scientist",
  "Bongoman plays big league",
  "Bongoman undercover",
].map((title, i) => ({
  title,
  // PLACEHOLDER: cycles through the site's existing palette until real
  // cover art replaces these cards. Once `cover` is set to an actual
  // image path, the card below falls back to that instead of the tint.
  tint: TINTS[i % TINTS.length],
  cover: null,
  // PLACEHOLDER: stands in for the per-book 2:1 illustration behind the
  // list until Mathew has real artwork for each title. Once `bg` is set
  // to an actual image path, the backdrop below falls back to that
  // instead of the tint block.
  bgTint: TINTS[(i + 2) % TINTS.length],
  bg: null,
  // PLACEHOLDER: real storefront or download link per book. Set this to
  // a URL and that card becomes a proper external link on its own; left
  // null it renders as a non-interactive "Coming soon" card instead of
  // an <a href="#"> that lies to screen readers.
  buyHref: null,
}));

// Must match the width and gap actually set in EbookCatalogue.css
// (.catalogue__card and .catalogue__track's gap). These numbers are
// how each card's on-screen position gets computed from scroll offset
// alone, without measuring every card on every scroll event.
const CARD_WIDTH = 160;
const CARD_GAP = 16;
const STEP = CARD_WIDTH + CARD_GAP;

// The list is tripled (prev copy, real copy, next copy) so there's a
// full extra screen of identical content on either side to scroll
// into. A scroll listener below silently snaps back by one set-width
// whenever the user drifts into a copy, which is invisible because the
// copies are pixel-identical, which is the whole trick behind the loop.
const loopedBooks = [...books, ...books, ...books];
const ONE_SET_WIDTH = books.length * STEP;

// The loop-reset itself: figures out which of the three copies is
// currently centered under the viewport and, if it isn't the middle
// one, shifts scrollLeft by exactly one set-width so it is. Every
// position and its +-ONE_SET_WIDTH equivalent show identical content,
// so this jump is imperceptible, not an animated correction.
//
// This is keyed off which CARD is centered rather than a raw scrollLeft
// threshold (the original approach) on purpose: a raw threshold like
// "scrollLeft < ONE_SET_WIDTH" doesn't account for the viewport's own
// width, so centering a card near the start of the middle copy can
// legitimately need scrollLeft to dip below that threshold (half the
// viewport is showing the tail of the previous copy) with nothing
// actually wrong. Checking the centered card's real copy number instead
// only corrects when the browser has actually drifted into copy 0 or
// copy 2, whatever the viewport width happens to be.
function applyLoopWrap(track) {
  const width = track.clientWidth;
  const nearest = Math.round((track.scrollLeft + width / 2 - CARD_WIDTH / 2) / STEP);
  const copy = Math.floor(nearest / books.length);
  if (copy !== 1) {
    track.scrollLeft -= (copy - 1) * ONE_SET_WIDTH;
  }
}

const cardVariants = {
  // A bigger, springier entrance than a plain fade: the pop-in is the
  // point here, not a subtle reveal.
  hidden: { opacity: 0, y: 50, scale: 0.7 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 16, mass: 0.7 },
  },
};

// One component per card (rather than calling useTransform inside the
// .map() below) for the same reason World.jsx's WorldStage/WorldDot
// are split out: hooks need a stable call order, which a hook called
// from inside an inline loop callback doesn't guarantee.
function CatalogueCard({ book, index, scrollX, trackWidth, isDuplicate }) {
  const cardCenter = index * STEP + CARD_WIDTH / 2;

  // How far this card sits from the middle of the visible track right
  // now, as a 0 (dead center) to 1 (a full card-width away or more)
  // fraction. Both the scale and the lift below are driven off this
  // same fraction, so the highlighted card grows AND rises together
  // rather than as two independently-tuned effects.
  const focus = useTransform(scrollX, (sx) => {
    if (!trackWidth) return 1;
    const viewportCenter = sx + trackWidth / 2;
    const distance = Math.abs(cardCenter - viewportCenter);
    return Math.min(distance / STEP, 1);
  });

  // Peak and resting sizes are unchanged (1.4 at centre, 1 at rest);
  // what changed is the shape between them. The old 3-stop version
  // dropped 0.28 across the first half-step and only 0.12 across the
  // second, so the rate of change more than doubled at the midpoint and
  // the growth visibly caught there. More stops on a smooth curve keep
  // the same cascade (one obvious front card, neighbours tapering) with
  // no sudden change in speed anywhere along it.
  const scale = useTransform(focus, [0, 0.25, 0.5, 0.75, 1], [1.4, 1.28, 1.14, 1.05, 1]);
  const lift = useTransform(focus, [0, 0.25, 0.5, 0.75, 1], [-24, -19, -11, -4, 0]);

  // Only a real destination makes this a link. While buyHref is null a
  // plain div is more honest than an <a href="#">, which a screen
  // reader announces as a working link and a mouse user finds does
  // nothing. Same reasoning as the store buttons.
  const isLink = Boolean(book.buyHref);
  const Tag = isLink ? motion.a : motion.div;
  const linkProps = isLink
    ? { href: book.buyHref, target: "_blank", rel: "noopener noreferrer" }
    : {};

  // The list is tripled to fake the infinite loop, so two of every
  // three cards are visual filler. Hiding those from assistive tech and
  // pulling them out of the tab order means a keyboard user meets
  // eleven books rather than thirty-three. Note aria-hidden and
  // tabIndex have to travel together here: an aria-hidden element that
  // is still focusable is its own accessibility bug.
  const hiddenProps = isDuplicate ? { "aria-hidden": "true", tabIndex: -1 } : {};

  return (
    <Tag
      {...linkProps}
      {...hiddenProps}
      className="catalogue__card-slot"
      variants={cardVariants}
      whileHover={{ rotate: -2 }}
    >
      <motion.div
        className="catalogue__card"
        style={{ background: book.cover ? undefined : book.tint, scale, y: lift }}
      >
        <span className="catalogue__card-halftone halftone" aria-hidden="true" />
        <span className="catalogue__card-tag">Ebook</span>
        <span className="catalogue__card-title comic-outline">{book.title}</span>
        {/* \u2192 rather than a literal arrow so the file stays pure
            ASCII and survives any encoding it gets copied through. */}
        <span className="catalogue__card-cta">{isLink ? "Get it \u2192" : "Coming soon"}</span>
      </motion.div>
    </Tag>
  );
}

// The one big illustration behind the row, standing in for the row of
// small cover cards the way a Storyline "states" image swaps its whole
// graphic per state: one book is "current" at a time (see activeIndex
// below), and this crossfades to that book's art rather than trying to
// show all eleven at once.
function CatalogueBackdrop({ book }) {
  return (
    <div className="catalogue__backdrop" aria-hidden="true">
      <AnimatePresence>
        <motion.div
          key={book.title}
          className="catalogue__backdrop-art"
          style={{ background: book.bg ? undefined : book.bgTint }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        >
          <span className="catalogue__backdrop-halftone halftone" />
          {!book.bg && <span className="catalogue__backdrop-label comic-outline">{book.title}</span>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function EbookCatalogue() {
  const trackRef = useRef(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useMotionValue(0);
  // True while an arrow-button animation (below) is manually driving
  // scrollLeft. The native 'scroll' listener's loop-reset is skipped
  // during that window (see why in scrollByCard's comment) and applied
  // once, on the animation's own completion, instead.
  const isButtonScrollRef = useRef(false);
  // Handle on the in-flight arrow animation, so a second click can stop
  // the first rather than leaving two tweens writing scrollLeft on the
  // same frame and fighting over it.
  const buttonScrollRef = useRef(null);

  // Which real (untripled) book currently sits centered under the
  // viewport, derived from the same scrollX driving each card's own
  // focus math. Kept as plain React state (via the subscription below)
  // rather than a motion value, because it picks which book's backdrop
  // to render, not something animated directly.
  const activeIndexRaw = useTransform(scrollX, (sx) => {
    if (!trackWidth) return 0;
    const viewportCenter = sx + trackWidth / 2;
    const nearest = Math.round((viewportCenter - CARD_WIDTH / 2) / STEP);
    return ((nearest % books.length) + books.length) % books.length;
  });
  useMotionValueEvent(activeIndexRaw, "change", (latest) => setActiveIndex(latest));

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Measure before positioning: the initial scroll offset needs the
    // track's own width to center a card under it (see below), not
    // just to size the loop-reset math.
    const width = track.clientWidth;
    setTrackWidth(width);

    // Center the first real-copy card under the viewport from the very
    // first frame, matching where scroll-snap will rest it after any
    // interaction, rather than starting at a raw offset that happens
    // to land wherever and only self-corrects after the first scroll.
    const firstCardCenter = ONE_SET_WIDTH + CARD_WIDTH / 2;
    track.scrollLeft = firstCardCenter - width / 2;
    scrollX.set(track.scrollLeft);

    const handleScroll = () => {
      // Skipped while an arrow-button animation owns scrollLeft: it
      // applies this same correction itself, once, when it finishes.
      // Doing it here too, mid-animation, would fight the animation's
      // own next frame (each undoing the other's jump every ~16ms).
      if (!isButtonScrollRef.current) {
        applyLoopWrap(track);
      }
      scrollX.set(track.scrollLeft);
    };

    const handleResize = () => setTrackWidth(track.clientWidth);

    track.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      track.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [scrollX]);

  const scrollByCard = (direction) => {
    const track = trackRef.current;
    if (!track) return;

    // Diagnosed cause of the arrow going dead after a couple of
    // clicks: native `scrollBy({behavior:"smooth"})` on a track with
    // `scroll-snap-type: mandatory` occasionally lands a few pixels
    // off the exact snap point (rounding in the initial centering
    // math), and a second smooth scrollBy fired while the browser is
    // still quietly settling that leftover snap correction gets
    // silently dropped, not just delayed, verified by watching
    // scrollLeft stop responding to further clicks entirely. Animating
    // scrollLeft ourselves sidesteps the native smooth-scroll+snap
    // interaction altogether: touch/trackpad dragging still uses the
    // browser's own snap behavior, only this button path is manual.
    const width = track.clientWidth;
    const nearest = Math.round((track.scrollLeft + width / 2 - CARD_WIDTH / 2) / STEP);
    const targetIndex = nearest + direction;
    const target = targetIndex * STEP + CARD_WIDTH / 2 - width / 2;

    // A click mid-flight retargets from wherever the row is right now,
    // rather than adding a second tween that writes scrollLeft on the
    // same frames as the first.
    buttonScrollRef.current?.stop();

    // `scroll-snap-type: mandatory` re-snaps the track on every single
    // scrollLeft write, so with it on the row teleported a whole card
    // on the first frame and then sat still while only the scale
    // animated: measured as scrollLeft 1542 -> 1718 between two frames,
    // versus a proper eased 1718 -> 1890 ramp with snap off. That
    // desync (position cutting, size sliding) is exactly the "not
    // moving, just shifting" feel. Snap is suspended for the length of
    // the animation and restored on the way out, so dragging by touch
    // or trackpad still snaps natively.
    track.style.scrollSnapType = "none";

    isButtonScrollRef.current = true;
    buttonScrollRef.current = animate(track.scrollLeft, target, {
      type: "tween",
      duration: 0.42,
      // Was [0.22, 1, 0.36, 1], which spent 100 of the 176px in the
      // first 70ms and then crept the last 16px over 380ms: a lurch
      // followed by a stall. This is gentler out of the gate and still
      // settles rather than stopping dead.
      ease: [0.33, 0.1, 0.25, 1],
      onUpdate: (value) => {
        track.scrollLeft = value;
        // Read the position back rather than reusing `value`: the cards'
        // scale and lift are driven off scrollX, so feeding it the real
        // scroll position is what keeps size locked to travel instead of
        // the two drifting apart.
        scrollX.set(track.scrollLeft);
      },
      onComplete: () => {
        applyLoopWrap(track);
        scrollX.set(track.scrollLeft);
        track.style.scrollSnapType = "";
        isButtonScrollRef.current = false;
        buttonScrollRef.current = null;
      },
    });
  };

  return (
    <div className="catalogue">
      <div className="catalogue__head">
        <span className="catalogue__label">The BONGOMAN Library</span>
        <p className="catalogue__caption">
          Eleven books and counting. Every one of them unlocks free as you play, or you can
          pick up a copy right now, in print or as an ebook.
        </p>
      </div>

      <div className="catalogue__row">
        <CatalogueBackdrop book={books[activeIndex]} />

        <button
          type="button"
          className="catalogue__arrow catalogue__arrow--prev"
          onClick={() => scrollByCard(-1)}
          aria-label="Scroll to previous books"
        >
          &#8592;
        </button>

        <motion.div
          className="catalogue__track"
          ref={trackRef}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {loopedBooks.map((book, i) => (
            <CatalogueCard
              key={`${book.title}-${i}`}
              book={book}
              index={i}
              scrollX={scrollX}
              trackWidth={trackWidth}
              // Only the middle copy is the real one; the outer two
              // exist purely so the loop has somewhere to scroll.
              isDuplicate={i < books.length || i >= books.length * 2}
            />
          ))}
        </motion.div>

        <button
          type="button"
          className="catalogue__arrow catalogue__arrow--next"
          onClick={() => scrollByCard(1)}
          aria-label="Scroll to more books"
        >
          &#8594;
        </button>
      </div>
    </div>
  );
}