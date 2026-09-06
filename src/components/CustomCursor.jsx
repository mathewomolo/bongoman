import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import "./CustomCursor.css";

// Feel of the "drag": how eagerly the eyeball body chases the real
// cursor. Lower stiffness / higher damping = a softer, slower catch-up
// with less bounce at the end. This is the one thing most likely to
// need retuning by feel once it's live, so it's pulled out here rather
// than buried in the transform below.
const BODY_SPRING = { stiffness: 170, damping: 20, mass: 0.6 };

// How far a pupil can travel inside its eyeball before it hits the rim,
// and how far the body has to be trailing the real pointer before the
// pupils reach that maximum. A small lag reads as a small glance; a big
// lag (body still catching up from across the screen) reads as pupils
// pinned hard toward the real cursor.
const PUPIL_MAX_OFFSET = 4;
const GAZE_DISTANCE_CAP = 60;

// Blink timing: how long the eyes stay shut, and the random range
// between blinks. Randomized rather than a fixed interval so it reads
// as a living thing occasionally blinking, not a metronome.
const BLINK_DURATION = 130;
const BLINK_MIN_GAP = 2600;
const BLINK_MAX_GAP = 6000;

// How long the mouse has to sit still before the cursor "says"
// something.
const IDLE_DELAY = 4500;

// PLACEHOLDER: these are lines already written and approved elsewhere
// on the site (Hero, Game, World, Ebooks headings/taglines), reused
// here rather than inventing new lore before Mathew's lore documents
// are in hand. Swap this list for real lore-doc lines once he's
// uploaded them. Nothing else about the bubble needs to change.
const IDLE_MESSAGES = [
  "From page to play.",
  "A Kenyan hero. A new adventure.",
  "From the familiar to the unknown.",
  "Run. Jump. Climb. Fight. Sneak. Swim. Explore.",
  "Read it. Discover it. Play it.",
];

// PLACEHOLDER: eyeball colors/size are placeholder styling (see
// CustomCursor.css). The tracking/drag mechanic itself is the real
// feature, not a placeholder. Swap colors once Mathew has a final look
// in mind for BONGOMAN's own cursor mascot.
export default function CustomCursor() {
  // Computed once at mount, not in an effect: only takes over the
  // pointer on devices with an actual precise mouse. Touch devices have
  // no persistent cursor to replace, and tracking touch coordinates
  // here would just leave the eyeball stuck on screen after every tap
  // with nowhere to go next.
  // Two gates, both checked once at mount. The pointer test keeps this
  // off touch devices (no persistent cursor to replace). The
  // reduced-motion test matters more than it looks: this thing replaces
  // the actual system pointer with a spring-lagged one, which is
  // exactly the kind of movement someone who turned that setting on is
  // asking not to have. They get their own cursor back.
  const [active] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [visible, setVisible] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [idleMessage, setIdleMessage] = useState(null);
  const hasPositionedRef = useRef(false);
  const idleTimerRef = useRef(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const bodyX = useSpring(rawX, BODY_SPRING);
  const bodyY = useSpring(rawY, BODY_SPRING);

  useEffect(() => {
    if (!active) return;

    document.body.classList.add("cursor-replaced");

    // Restarts the "you've stopped moving" clock. Called on every real
    // move (so it keeps pushing the bubble off while you're active) and
    // once right after a bubble is dismissed by movement.
    const scheduleIdleMessage = () => {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        const line = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
        setIdleMessage(line);
      }, IDLE_DELAY);
    };

    const handleMove = (event) => {
      // First real position: jump the body straight there instead of
      // springing in from the top-left corner, so the very first frame
      // the cursor appears in is already at the mouse, not mid-flight.
      if (!hasPositionedRef.current) {
        hasPositionedRef.current = true;
        bodyX.jump(event.clientX);
        bodyY.jump(event.clientY);
      }
      rawX.set(event.clientX);
      rawY.set(event.clientY);
      setVisible(true);
      setIdleMessage(null);
      scheduleIdleMessage();
    };
    const handleLeave = () => {
      setVisible(false);
      setIdleMessage(null);
      clearTimeout(idleTimerRef.current);
    };
    const handleEnter = () => {
      if (hasPositionedRef.current) setVisible(true);
    };

    window.addEventListener("mousemove", handleMove);
    document.documentElement.addEventListener("mouseleave", handleLeave);
    document.documentElement.addEventListener("mouseenter", handleEnter);

    return () => {
      document.body.classList.remove("cursor-replaced");
      window.removeEventListener("mousemove", handleMove);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
      document.documentElement.removeEventListener("mouseenter", handleEnter);
      clearTimeout(idleTimerRef.current);
    };
  }, [active, rawX, rawY, bodyX, bodyY]);

  // Separate effect from the mouse tracking above: this one is just a
  // self-scheduling timer, unrelated to pointer position, so it's kept
  // apart rather than folded into the move-listener effect.
  useEffect(() => {
    if (!active) return;

    let openTimer;
    let closeTimer;

    const scheduleBlink = () => {
      const gap = BLINK_MIN_GAP + Math.random() * (BLINK_MAX_GAP - BLINK_MIN_GAP);
      openTimer = setTimeout(() => {
        setBlinking(true);
        closeTimer = setTimeout(() => {
          setBlinking(false);
          scheduleBlink();
        }, BLINK_DURATION);
      }, gap);
    };

    scheduleBlink();

    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  }, [active]);

  // The gaze vector runs from the eyeball's current (still-catching-up)
  // position to the real, live pointer position, not to the body's own
  // spring target. That gap is what makes the pupils look "ahead"
  // toward where the cursor actually is while the shape is still
  // dragging its way there.
  const dx = useTransform([rawX, bodyX], ([rx, bx]) => rx - bx);
  const dy = useTransform([rawY, bodyY], ([ry, by]) => ry - by);

  const pupilX = useTransform([dx, dy], ([x, y]) => {
    const distance = Math.hypot(x, y) || 1;
    const clamped = Math.min(distance, GAZE_DISTANCE_CAP);
    return (x / distance) * PUPIL_MAX_OFFSET * (clamped / GAZE_DISTANCE_CAP);
  });
  const pupilY = useTransform([dx, dy], ([x, y]) => {
    const distance = Math.hypot(x, y) || 1;
    const clamped = Math.min(distance, GAZE_DISTANCE_CAP);
    return (y / distance) * PUPIL_MAX_OFFSET * (clamped / GAZE_DISTANCE_CAP);
  });

  if (!active) return null;

  return (
    <>
      <motion.div
        className="custom-cursor"
        style={{ x: bodyX, y: bodyY, opacity: visible ? 1 : 0 }}
        aria-hidden="true"
      >
        <div className="custom-cursor__inner">
          <span className={`custom-cursor__eye${blinking ? " custom-cursor__eye--blink" : ""}`}>
            <motion.span className="custom-cursor__pupil" style={{ x: pupilX, y: pupilY }} />
          </span>
          <span className={`custom-cursor__eye${blinking ? " custom-cursor__eye--blink" : ""}`}>
            <motion.span className="custom-cursor__pupil" style={{ x: pupilX, y: pupilY }} />
          </span>
        </div>
      </motion.div>
      {/* Two-layer setup, not one element: the anchor's x/y is the
          live cursor position (a motion value, updated every frame),
          while the inner bubble's opacity/scale is a one-off enter/exit
          animation. Both need the `transform` property, and putting
          them on the same element would make framer-motion's animation
          fight its own position tracking. Splitting them means the
          anchor only ever sets x/y, and the inner bubble only ever
          sets scale, so neither overwrites the other's transform. */}
      <AnimatePresence>
        {idleMessage && (
          <motion.div
            key={idleMessage}
            className="custom-cursor__bubble-anchor"
            style={{ x: bodyX, y: bodyY }}
            aria-hidden="true"
          >
            <motion.div
              className="custom-cursor__bubble"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {idleMessage}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}