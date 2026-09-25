import { useEffect, useMemo, useRef, useState } from "react";
import "./MellowTrail.css";

/* Cursor image trail for the Mellowphant section.

   Images are dropped along the path the pointer travels, each one
   popping in and fading out behind it. Reference behaviour is the card
   trail on makemepulse.com, which is WebGL. This is the DOM version:
   most of the feel, a fraction of the complexity, and it fits the rest
   of the site.

   THE ONE DECISION THAT MAKES IT READ AS A TRAIL: images spawn every
   SPAWN_DISTANCE pixels of pointer travel, never on a timer. On a timer
   a slow cursor stacks images on one spot into a pile and a fast flick
   leaves a gap. Keyed to distance, the spacing is identical however
   fast the pointer moves. */

// PLACEHOLDER: twelve labelled 400x400 stand-ins in
// public/images/mellowphant/trail/. Real Mellowphant Games artwork
// drops in at the same filenames and size, no code change.
const FILES = Array.from(
  { length: 12 },
  (_, i) => `/images/mellowphant/trail/trail-${String(i + 1).padStart(2, "0")}.jpg`,
);

// How far the pointer travels between drops. Raise it for a sparser
// trail, lower it for a denser one. This is the number to tune first.
const SPAWN_DISTANCE = 80;

// How far an image may be rotated from upright, in degrees either way.
// Without it the trail looks stamped rather than scattered.
const MAX_TILT = 8;

/* Everything about TIMING lives in MellowTrail.css, deliberately.

   The pool is cycled round robin, so this file never needs to know how
   long an image lives: by the time the index comes back around, the
   first one has long finished. That means the life duration exists in
   exactly one place, and changing it in the CSS cannot fall out of sync
   with a constant in here. */

function shuffle(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function MellowTrail() {
  /* ONE GATE, NOT TWO. This used to also require (pointer: fine), the
     same check CustomCursor makes, which excluded every phone. That was
     wrong for this component: a finger dragging across the section is a
     perfectly good way to lay a trail, even though it cannot hover.

     CustomCursor still needs its pointer gate, because it replaces the
     system cursor and a touch device has no cursor to replace. This one
     only needs a position, and a finger has one.

     Reduced motion still bails. Images flying off a drag is exactly the
     kind of movement that setting asks not to have. */
  const [active] = useState(
    () =>
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  /* Shuffled ONCE at mount, then cycled in order. Picking at random on
     every spawn draws the same image twice in a row often enough to
     read as a bug rather than as randomness. Each slot then owns one
     image for the life of the component, so no `src` ever changes at
     runtime and nothing pops in half loaded. */
  const order = useMemo(() => shuffle(FILES), []);

  const layerRef = useRef(null);
  const slotsRef = useRef([]);
  const imgsRef = useRef([]);
  const indexRef = useRef(0);
  const lastRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    const layer = layerRef.current;
    if (!layer) return undefined;

    /* The listener goes on the SECTION, not the window, so this costs
       nothing anywhere else on the page. The layer itself is
       pointer-events: none, so events reach the section normally and
       the copy underneath stays selectable. */
    const host = layer.parentElement;
    if (!host) return undefined;

    const spawn = (clientX, clientY) => {
      /* getBoundingClientRect forces a layout read, so it happens here,
         once per drop, rather than on every pointermove. The distance
         check above runs in viewport coordinates and needs no rect at
         all. */
      const rect = layer.getBoundingClientRect();
      const i = indexRef.current;
      const slot = slotsRef.current[i];
      const img = imgsRef.current[i];
      if (!slot || !img) return;

      slot.style.transform = `translate(${clientX - rect.left}px, ${clientY - rect.top}px)`;
      img.style.setProperty("--rot", `${(Math.random() * 2 - 1) * MAX_TILT}deg`);

      /* A CSS animation does not replay on an element that already ran
         it. Removing the class, reading a layout property to force the
         removal to apply, then re-adding it is what restarts it. The
         read is deliberate and is why this is not simply a class
         toggle. */
      img.classList.remove("is-live");
      void img.offsetWidth;
      img.classList.add("is-live");

      indexRef.current = (i + 1) % order.length;
    };

    const handleMove = (event) => {
      const last = lastRef.current;
      if (!last) {
        lastRef.current = { x: event.clientX, y: event.clientY };
        spawn(event.clientX, event.clientY);
        return;
      }
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      if (Math.hypot(dx, dy) < SPAWN_DISTANCE) return;

      lastRef.current = { x: event.clientX, y: event.clientY };
      spawn(event.clientX, event.clientY);
    };

    /* Clearing the last point, so the next move starts a fresh trail
       rather than measuring its distance from wherever the pointer was
       when it left. On touch that matters more than on a mouse: without
       it, lifting a finger and putting it down elsewhere would drop a
       row of images along the line between the two. */
    const handleLeave = () => {
      lastRef.current = null;
    };

    host.addEventListener("pointermove", handleMove, { passive: true });
    host.addEventListener("pointerleave", handleLeave);

    /* pointerleave does not fire when a finger lifts, and pointercancel
       is what fires when the browser claims the gesture for scrolling.
       Both have to clear the last point or the next touch continues the
       previous stroke. */
    host.addEventListener("pointerup", handleLeave);
    host.addEventListener("pointercancel", handleLeave);

    return () => {
      host.removeEventListener("pointermove", handleMove);
      host.removeEventListener("pointerleave", handleLeave);
      host.removeEventListener("pointerup", handleLeave);
      host.removeEventListener("pointercancel", handleLeave);
    };
  }, [active, order]);

  if (!active) return null;

  return (
    <div className="mtrail" ref={layerRef} aria-hidden="true">
      {order.map((src, i) => (
        /* Two elements per slot, not one. The slot carries POSITION,
           set by JavaScript. The image carries the POP, animated by
           CSS. transform is a single property, so an animation and a
           position set on the same element overwrite each other. Same
           split as the bubble anchor in CustomCursor. */
        <span
          className="mtrail__slot"
          key={src}
          ref={(el) => {
            slotsRef.current[i] = el;
          }}
        >
          <img
            className="mtrail__img"
            src={src}
            alt=""
            width="400"
            height="400"
            ref={(el) => {
              imgsRef.current[i] = el;
            }}
          />
        </span>
      ))}
    </div>
  );
}