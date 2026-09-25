import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { plexusSignal } from "../lib/plexusSignal.js";
import "./CustomCursor.css";

// Feel of the "drag": how eagerly the eyeball body chases the real
// cursor. Lower stiffness / higher damping = a softer, slower catch-up
// with less bounce at the end.
const BODY_SPRING = { stiffness: 170, damping: 20, mass: 0.6 };

// How far a pupil can travel inside its eyeball before it hits the rim,
// and how far the body has to be trailing the real pointer before the
// pupils reach that maximum.
const PUPIL_MAX_OFFSET = 4;
const GAZE_DISTANCE_CAP = 60;

// Blink timing. Randomized rather than a fixed interval so it reads as
// a living thing occasionally blinking, not a metronome.
const BLINK_DURATION = 130;
const BLINK_MIN_GAP = 2600;
const BLINK_MAX_GAP = 6000;

const IDLE_DELAY = 4500;

/* STRAIN: the effort of holding the stars in.

   One value from 0 to 1 drives everything, so there is a single number
   to tune rather than three fighting each other. It climbs while the
   button is down and falls quickly when it is not.

   THE RECOIL IS NOT WRITTEN. STRAIN_SPRING is deliberately
   underdamped, so when strain drops to 0 the spring following it
   overshoots into negative territory before settling. The eyes pop
   slightly wider than normal for a moment, which is what letting go of
   something heavy looks like. Raising damping removes it.

   SHAKE_MAX is squared against strain when applied, so a brief press
   barely trembles and a long hold visibly struggles. */
const STRAIN_RISE_MS = 1200;
const STRAIN_FALL_MS = 220;
const STRAIN_SPRING = { stiffness: 260, damping: 14, mass: 0.5 };

/* The charge gets its OWN spring, far calmer than the eyes'.

   The eyes want the bounce, because letting go of something heavy
   should snap. Light does not snap, it swells, and sharing the bouncy
   spring made the glow arrive almost the instant the button went down.
   That read as a state switching on rather than as energy gathering.

   Rise is now roughly eight times longer than fall, deliberately. Slow
   to earn and instant to lose is what makes holding it feel like it
   cost something. */
const CHARGE_SPRING = { stiffness: 90, damping: 26, mass: 1 };
const SHAKE_MAX = 1.7;

/* How many held stars count as a full charge. The glow used to be a
   stopwatch, which rewarded waiting. Counting what you are actually
   holding rewards gathering: one star is dim, fourteen is full, and
   holding an empty patch of sky earns nothing at all. */
const CAPTURE_FULL = 6;

/* PLACEHOLDER copy, mine rather than Mathew's.

   THE VOICE: four words maximum, plain, funny because it is flat
   rather than because it is winking. These used to be marketing lines
   lifted from the page headings, which made the cursor sound like an
   advert with eyes.

   The bluntness belongs to the CURSOR, which is two eyeballs and not
   very bright. It does NOT extend to how Bongoman himself is
   described: those lines stay grammatical. A simpleton voice narrating
   the character rather than narrating itself reads as something other
   than a joke. */
const IDLE_MESSAGES = [
  "We watch you.",
  "He jumps high.",
  "Made by hand.",
  "Game soon.",
  "Slow down.",
];

/* PLACEHOLDER copy, mine rather than Mathew's.

   THE BUBBLE'S TIMING DOES NOT CHANGE. It still only appears after the
   idle delay, never on demand and never as a reward for an action.
   Firing it on the hold was tried and rejected: a bubble that answers
   an interaction stops being the cursor idly saying something and
   becomes a notification.

   All that changes is WHICH list it draws from. If the idle moment
   happens to land inside an opted-in section, the line can speak to
   that section. It is also the one honest place to teach the hold,
   since nothing else on the page advertises it. */
const CTA_MESSAGES = [
  "Hold button.",
  "Group down there.",
  "Come make game.",
];

// PLACEHOLDER: eyeball colors/size are placeholder styling. The
// tracking mechanic itself is the real feature.
export default function CustomCursor() {
  /* Two gates, both checked once at mount. The pointer test keeps this
     off touch devices (no persistent cursor to replace). The
     reduced-motion test matters more than it looks: this replaces the
     system pointer with a spring-lagged one, exactly the movement
     someone who turned that setting on is asking not to have. */
  const [active] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [visible, setVisible] = useState(false);

  const [glowing, setGlowing] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [idleMessage, setIdleMessage] = useState(null);
  const hasPositionedRef = useRef(false);
  const idleTimerRef = useRef(null);

  // A ref as well as the state. The state drives the glow class; the
  // ref is what the idle timer reads when it fires, because that
  // callback is created once and would otherwise close over whatever
  // `glowing` happened to be when the effect ran.
  const glowingRef = useRef(false);

  // Strain lives in a ref as well as a motion value. The ref is what
  // the animation loop reads and writes every frame; the motion value
  // is what the DOM reads. Keeping the loop off React state is the
  // whole reason this does not re-render sixty times a second.
  const holdingRef = useRef(false);
  const strainRef = useRef(0);
  const startLoopRef = useRef(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const bodyX = useSpring(rawX, BODY_SPRING);
  const bodyY = useSpring(rawY, BODY_SPRING);

  const strain = useMotionValue(0);
  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);
  const strained = useSpring(strain, STRAIN_SPRING);

  // clamp: false on the eye scales is what lets the spring's overshoot
  // actually show. Clamped, the recoil would be silently flattened back
  // to the resting value and the release would look like a stop.
  const eyeScaleX = useTransform(strained, [0, 1], [1, 1.07], { clamp: false });
  const eyeScaleY = useTransform(strained, [0, 1], [1, 0.86], { clamp: false });
  /* Four stops rather than two, which makes the curve an ease IN:
     almost nothing for the first third, then it runs away with itself.
     A straight line from 0 to 1 spends half its time already clearly
     visible, which is what made a long hold feel the same as a short
     one. The payoff has to be back-loaded or there is no reason to keep
     holding. */
  const charged = useSpring(strain, CHARGE_SPRING);
  const chargeScale = useTransform(charged, [0, 0.35, 0.7, 1], [0.2, 0.42, 0.8, 1.5]);
  const chargeOpacity = useTransform(charged, [0, 0.3, 0.7, 1], [0, 0.1, 0.45, 1]);

  useEffect(() => {
    if (!active) return undefined;

    document.body.classList.add("cursor-replaced");

    const scheduleIdleMessage = () => {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        // Read at FIRE time, not at schedule time: the pointer can have
        // moved between the two, and the line should match where it
        // actually came to rest.
        const pool = glowingRef.current ? CTA_MESSAGES : IDLE_MESSAGES;
        setIdleMessage(pool[Math.floor(Math.random() * pool.length)]);
      }, IDLE_DELAY);
    };

    const handleMove = (event) => {
      // First real position: jump the body straight there instead of
      // springing in from the top-left corner.
      if (!hasPositionedRef.current) {
        hasPositionedRef.current = true;
        bodyX.jump(event.clientX);
        bodyY.jump(event.clientY);
      }
      rawX.set(event.clientX);
      rawY.set(event.clientY);
      setVisible(true);

      /* A section opts in by carrying data-cursor-glow. Reading it off
         the event target rather than keeping a list here means a new
         section joins by adding one attribute. */
      const overGlow = !!event.target?.closest?.("[data-cursor-glow]");
      glowingRef.current = overGlow;
      setGlowing(overGlow);

      setIdleMessage(null);
      scheduleIdleMessage();
    };

    const handleDown = (event) => {
      if (!event.target?.closest?.("[data-cursor-glow]")) return;
      // A press on an actual control is someone clicking the button,
      // not someone gathering stars. Straining there would fight the
      // thing we are trying to send them to.
      if (event.target?.closest?.("a, button, input, select, textarea")) return;
      holdingRef.current = true;
      if (startLoopRef.current) startLoopRef.current();
    };

    const handleUp = () => {
      holdingRef.current = false;
      if (startLoopRef.current) startLoopRef.current();
    };

    const handleLeave = () => {
      setVisible(false);
      setIdleMessage(null);
      handleUp();
      clearTimeout(idleTimerRef.current);
    };
    const handleEnter = () => {
      if (hasPositionedRef.current) setVisible(true);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    window.addEventListener("blur", handleUp);
    document.documentElement.addEventListener("mouseleave", handleLeave);
    document.documentElement.addEventListener("mouseenter", handleEnter);

    return () => {
      document.body.classList.remove("cursor-replaced");
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      window.removeEventListener("blur", handleUp);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
      document.documentElement.removeEventListener("mouseenter", handleEnter);
      clearTimeout(idleTimerRef.current);
    };
  }, [active, rawX, rawY, bodyX, bodyY]);

  /* The strain loop. It is NOT always running: it starts on a press and
     stops itself once strain has returned to exactly zero, so an idle
     page is paying nothing for a feature nobody is using. */
  useEffect(() => {
    if (!active) return undefined;

    let raf = null;
    let last = 0;

    const tick = (now) => {
      // Capped, because a backgrounded tab resumes with a delta of
      // several seconds and would snap strain to its limit in one frame.
      const delta = Math.min(64, now - last);
      last = now;

      let s = strainRef.current;
      if (holdingRef.current) {
        // The ceiling is how many stars are held, not how long the
        // button has been down. Rate limited in both directions so it
        // swells and ebbs rather than jumping as stars arrive and leave.
        const target = Math.min(1, plexusSignal.captured / CAPTURE_FULL);
        s =
          s < target
            ? Math.min(target, s + delta / STRAIN_RISE_MS)
            : Math.max(target, s - delta / STRAIN_FALL_MS);
      } else {
        s = Math.max(0, s - delta / STRAIN_FALL_MS);
      }
      strainRef.current = s;
      strain.set(s);

      // Squared, so effort ramps rather than switches on.
      const amp = s * s * SHAKE_MAX;
      if (amp > 0.001) {
        shakeX.set((Math.random() - 0.5) * 2 * amp);
        shakeY.set((Math.random() - 0.5) * 2 * amp);
      } else {
        shakeX.set(0);
        shakeY.set(0);
      }


      if (holdingRef.current || s > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    };

    startLoopRef.current = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    return () => {
      if (raf) cancelAnimationFrame(raf);
      startLoopRef.current = null;
    };
  }, [active, strain, shakeX, shakeY]);

  useEffect(() => {
    if (!active) return undefined;

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

  // The gaze vector runs from the eyeball's still-catching-up position
  // to the real live pointer, not to the body's spring target. That gap
  // is what makes the pupils look ahead toward where the cursor
  // actually is while the shape is still dragging its way there.
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
      {/* The glow, behind the eyeball.

          IT FOLLOWS THE EYEBALL, NOT THE POINTER. bodyX and bodyY are
          the spring-lagged position, the same values the eyeball uses,
          so the two read as one object.

          It lives in here rather than in its own component because of
          that shared spring. The Erevuka build learned the other half
          the hard way: a glow per section gets cropped at every
          section's overflow: hidden, showing two half circles at the
          boundary. This one is page level and position: fixed. */}
      <motion.div
        className="custom-cursor__glow-anchor"
        style={{ x: bodyX, y: bodyY, opacity: visible ? 1 : 0 }}
        aria-hidden="true"
      >
        <span className={`custom-cursor__glow${glowing ? " custom-cursor__glow--on" : ""}`} />

        {/* The gathered energy. A separate, smaller, hotter layer rather
            than brightening the ambient glow, because the two are doing
            different jobs: one says where you are, this one says how
            hard you are pulling. */}
        <motion.span
          className="custom-cursor__charge"
          style={{ scale: chargeScale, opacity: chargeOpacity }}
        />
      </motion.div>

      {/* THREE NESTED ELEMENTS, ONE TRANSFORM EACH. transform is a
          single property, so position, shake and squeeze cannot share
          an element without silently overwriting one another. Same trap
          as the birds' flight and flap.

            .custom-cursor   position, from the body spring
            __shake          the tremble
            __squeeze        the contraction of effort
            __inner          the static translate(-50%, -50%) centring

          originX/originY are 0 on the squeeze because __inner's own
          -50% translate already puts the eyes' centre exactly on the
          wrapper's top-left corner. Scaling about that corner therefore
          holds the eyes in place; the default centre origin would drift
          them down and right as they squeeze. */}
      <motion.div
        className="custom-cursor"
        style={{ x: bodyX, y: bodyY, opacity: visible ? 1 : 0 }}
        aria-hidden="true"
      >
        <motion.div className="custom-cursor__shake" style={{ x: shakeX, y: shakeY }}>
          <motion.div
            className="custom-cursor__squeeze"
            style={{ scaleX: eyeScaleX, scaleY: eyeScaleY, originX: 0, originY: 0 }}
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
        </motion.div>
      </motion.div>

      {/* Two-layer setup for the same reason: the anchor's x/y is the
          live position, the inner bubble's scale is a one-off
          enter/exit animation, and both want transform. */}
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