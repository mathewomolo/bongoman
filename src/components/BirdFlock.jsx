import { useCallback, useEffect, useRef, useState } from "react";
import "./BirdFlock.css";

/* A flock that bursts out of wherever you click in the hero.

   Click-driven rather than pointer-driven, deliberately. The resting
   birds live at one fixed spot, so "scatter away from the cursor" would
   only ever work in that one corner of the section. A click has no fixed
   place, so the interaction works anywhere in the hero.

   CHEAP BY CONSTRUCTION. Clicks are rare, unlike pointermove, so this
   mounts and unmounts real elements per flock rather than recycling a
   pool. At most MAX_FLOCKS x FLOCK_MAX elements exist at once, and each
   one removes itself when its flight ends.

   All the motion is CSS. JavaScript decides WHERE each bird goes and
   hands it over as custom properties; the stylesheet owns every
   duration. That keeps the timing tunable in one file and means this one
   never has to know how long a flight lasts. */

// How many birds in one burst. A range rather than a fixed number, so
// two clicks in the same spot do not produce the same picture twice.
const FLOCK_MIN = 5;
const FLOCK_MAX = 9;

// Concurrent flocks kept alive. Older ones are dropped rather than
// queued, so leaning on the mouse button cannot pile up elements.
const MAX_FLOCKS = 3;

// Total angle the burst fans across, in degrees, centred on straight up.
// Upward on purpose: a bird flying downward reads as falling.
const SPREAD_DEG = 150;

// How far a bird travels before it is gone, in px.
const DIST_MIN = 220;
const DIST_MAX = 520;

// Longest possible life of one bird, flight plus its stagger, in ms.
// Only used to schedule removal, and it must stay at or above the largest
// --dur the component can generate plus the largest delay below.
const LIFE_MS = 2900;

// Stagger, so a flock leaves in a ripple rather than as a block.
const DELAY_MAX_MS = 180;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

/* One gull mark, the same curve the resting birds use. The wing beat is
   scaleY on this element while the parent handles the travel: transform
   is a single property, so flight and flap have to live on different
   elements or one overwrites the other. */
function Gull() {
  return (
    <svg className="flock__wing" viewBox="0 0 24 12" aria-hidden="true">
      <path
        d="M 2 8 Q 12 0 22 8 Q 12 2 2 8"
        fill="none"
        stroke="var(--color-paper)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BirdFlock() {
  const layerRef = useRef(null);
  const [flocks, setFlocks] = useState([]);
  const timersRef = useRef([]);
  const seqRef = useRef(0);

  const remove = useCallback((id) => {
    setFlocks((prev) => prev.filter((f) => f.id !== id));
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return undefined;

    // Reduced motion gets no flock at all. A burst of birds is the
    // definition of movement nobody asked for.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    // No (pointer: fine) gate here, unlike the parallax. A tap on a
    // phone is a perfectly good way to set birds off.
    const host = layer.parentElement;
    if (!host) return undefined;

    const handleDown = (event) => {
      /* "Anywhere idle" means anywhere that was not already doing
         something. A click on a store button or a carousel dot belongs
         to that control, and stealing it to make birds would be the
         kind of cleverness that gets torn out later. */
      if (event.target.closest("a, button, input, select, textarea, [role='button']")) return;

      const rect = layer.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      seqRef.current += 1;
      const id = seqRef.current;
      const count = Math.round(rand(FLOCK_MIN, FLOCK_MAX));
      const half = (SPREAD_DEG / 2) * (Math.PI / 180);

      const birds = Array.from({ length: count }, (_, i) => {
        // Evenly fanned across the spread, then jittered, so the burst
        // covers the whole arc instead of clustering wherever the
        // random numbers happened to land.
        const t = count === 1 ? 0.5 : i / (count - 1);
        const angle = -Math.PI / 2 + (t - 0.5) * 2 * half + rand(-0.12, 0.12);
        const dist = rand(DIST_MIN, DIST_MAX);
        return {
          key: `${id}-${i}`,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          size: rand(14, 26),
          dur: rand(1.6, 2.6),
          delay: rand(0, DELAY_MAX_MS) / 1000,
          flap: rand(0.16, 0.28),
        };
      });

      setFlocks((prev) => {
        const next = [...prev, { id, x, y, birds }];
        return next.length > MAX_FLOCKS ? next.slice(next.length - MAX_FLOCKS) : next;
      });

      const timer = setTimeout(() => remove(id), LIFE_MS);
      timersRef.current.push(timer);
    };

    host.addEventListener("pointerdown", handleDown);
    return () => {
      host.removeEventListener("pointerdown", handleDown);
    };
  }, [remove]);

  // Timers are cleared on unmount only. Clearing per flock would mean
  // tracking which timer belongs to which id for no gain: a flock that
  // is already gone is removed by a filter that matches nothing.
  useEffect(() => {
    const timers = timersRef;
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  return (
    <div className="flock" ref={layerRef} aria-hidden="true">
      {flocks.map((f) =>
        f.birds.map((b) => (
          <span
            key={b.key}
            className="flock__bird"
            style={{
              left: f.x,
              top: f.y,
              "--dx": `${b.dx}px`,
              "--dy": `${b.dy}px`,
              "--size": `${b.size}px`,
              "--dur": `${b.dur}s`,
              "--delay": `${b.delay}s`,
              "--flap": `${b.flap}s`,
            }}
          >
            <Gull />
          </span>
        )),
      )}
    </div>
  );
}