import { useEffect, useRef } from "react";
import "./PlexusField.css";

/* =========================================================
   TWO POPULATIONS, AND THE REASON FOR IT.

   The expensive part of a plexus has never been the stars, it is the
   PAIRS: every linking star must be measured against every other one,
   so doubling the count quadruples that loop. Meanwhile a star that
   only drifts and glows costs one drawImage and nothing else.

   So the field is split. STARS link, react to the cursor, and carry
   the web. DUST is the far layer: it drifts, it twinkles, it is never
   measured against anything and never reacts to the pointer. That is
   not a shortcut, it is the depth story being honest. A star that far
   away does not move because you waved at it.

   Raising DUST is close to free. Raising STAR_MAX is not.
   ========================================================= */

const DPR_CAP = 2;

const STAR_AREA = 18000;  // one linking star per this many square px
const STAR_MIN = 18;
const STAR_MAX = 70;
const DUST_AREA = 6400;
const DUST_MIN = 40;
const DUST_MAX = 150;

const GOLD_RATIO = 0.18;  // share of stars born with the warm tint

/* DEPTH. One number per star, 0 far and 1 near, driving five things at
   once. This is what stops the field reading as a flat sheet of dots:
   near stars are bigger, brighter, drift faster and get shoved hard,
   far ones barely notice the cursor at all. Each pair below is
   [value at depth 0, value at depth 1]. */
const DEPTH_SIZE = [0.55, 1.15];
const DEPTH_ALPHA = [0.28, 1.0];
const DEPTH_SPEED = [0.45, 1.25];
const DEPTH_PUSH = [0.2, 1.0];

const SPEED = 0.18;       // px per frame of base drift, before depth
const STAR_MIN_R = 1.0;
const STAR_MAX_R = 2.6;

/* THE GLOW SPRITE replaces ctx.shadowBlur, which was by far the most
   expensive line in the old version: a real gaussian blur, on the CPU
   in most browsers, recomputed for every star on every frame. A single
   radial gradient rendered once into an offscreen canvas and stamped
   with drawImage is roughly ten times cheaper, and it looks better,
   because a gradient is a real falloff rather than a blur of a hard
   circle.

   SPRITE_PX is its resolution. GLOW_SCALE is how many times the star's
   own radius the sprite is stamped at, so the visible dot is small and
   the halo around it is wide. */
const SPRITE_PX = 64;
const GLOW_SCALE = 7.5;
const DUST_GLOW_SCALE = 5.5;

// Slow, so it reads as a sky rather than a string of fairy lights.
const TWINKLE_MIN = 0.0007;
const TWINKLE_MAX = 0.0032;
const TWINKLE_DEPTH = 0.34;   // share of brightness that swings

/* THE CURSOR.

   Force goes into a decaying velocity rather than straight into
   position. The old version added to position while the cursor was in
   range, which meant a star stopped dead the instant you left it. Now
   it carries on and settles, which is the difference between a field
   of dots and a field with mass.

   SWIRL is per star, not global. swirl is drawn as a random sign times
   a random magnitude raised to SWIRL_BIAS, and raising a number below
   one to a power pushes it toward zero, so most stars are born with
   almost no swirl and get shoved straight out from behind. A minority
   curl, and they curl in both directions. Raise SWIRL_BIAS for more
   straight ones. Set SWIRL to 0 and every star goes straight. */
const REPEL_RADIUS = 115;
const REPEL_FORCE = 1.6;
const ATTRACT_FORCE = 1.15;
const SWIRL = 0.95;
const SWIRL_BIAS = 2.4;
const DRAG = 0.92;

/* SOFTENING. The cursor force is now an inverse square, 1 over r
   squared, the law gravity and electrostatics actually obey, instead of
   the straight line it used to be. That law goes to infinity as r goes
   to zero, so a star landing on the exact cursor pixel would be flung
   off the screen. The fix is the one real N-body simulations use: add a
   constant to the denominator, 1 over (r squared plus e squared). e is
   the SOFTENING LENGTH, and at r equals e the force is exactly half its
   maximum. Nothing can diverge, and past a few e it is
   indistinguishable from true inverse square.

   REPEL_FORCE and ATTRACT_FORCE were rescaled when this went in. The
   old linear law spent most of its range at middling strength. This one
   is fierce up close and nearly nothing far away, so the numbers had to
   grow to feel like anything. */
const SOFTEN = 26;

/* ORBITS. While you hold, friction nearly switches off. That one number
   is the whole effect: with damping gone a star pulled inward does not
   land on the cursor, it MISSES and swings past, which is an orbit.

   And because a centre-seeking force applies no torque, angular
   momentum is conserved, so a star falling from twice the distance
   arrives spinning twice as fast. That is the figure skater pulling
   their arms in. Nothing in the code implements it. It falls out. */
const HOLD_DRAG = 0.985;

/* PERSONAL SPACE. Stars now push each OTHER apart below this distance,
   which makes the even spacing that used to appear only in the ring
   around the cursor true everywhere instead.

   This is the repulsive core of the Lennard-Jones potential, the reason
   two atoms cannot occupy the same place. The full potential has an
   attractive tail as well, and switching that on would make the field
   crystallise into a honeycomb, because that is what evenly spaced
   mutually repelling points do. We want only the core.

   The push is applied equally and oppositely to both stars, which is
   Newton's third law and is what conserves the pair's momentum. Push
   only one of them and the whole field slowly drifts off screen.

   SPACING_FORCE MUST STAY BELOW WHAT DRAG CAN ABSORB. The first attempt
   used 0.2, and a star with six neighbours then gained 1.2 per frame
   against an 8 percent bleed, which settles at three times KICK_MAX. So
   every star with company sat pinned at maximum speed, the field boiled,
   and the frame rate went with it. Set this to 0 to switch mutual
   repulsion off entirely. */
const SPACING = 42;
const SPACING_FORCE = 0.018;

/* Brightness carries kinetic energy, which goes as v squared. This
   makes damping VISIBLE: shove the field and watch the heat bleed out
   of it over about a second.

   It rides almost entirely on ALPHA rather than on size. A bigger
   sprite is more pixels blended, and under additive compositing the
   page pays for every one of them, so heat driving size was how the
   first attempt turned a physics bug into a fillrate collapse. */
const KE_GAIN = 0.12;
const KICK_MAX = 5;       // cap, or holding still in one spot accumulates forever

const LINK_DIST = 140;
const CURSOR_LINK_DIST = 185;

// The web tightens while the pointer is moving fast and relaxes when it
// stops. SPEED_REF is roughly the px per frame that counts as "fast".
const SPEED_REF = 26;
const SPEED_TIGHTEN = 0.2;

const SHOOT_FIRST_MS = 4200;   // one early, so it is not a rumour
const SHOOT_MIN_MS = 12000;
const SHOOT_MAX_MS = 26000;
const SHOOT_MS = 950;
const SHOOT_TAIL = 130;

const PAPER_RGB = "243, 236, 217";
const ACCENT_RGB = "242, 169, 59";

/* LINK BUCKETS. Every link used to be its own beginPath and stroke,
   because every link had its own alpha, and a busy frame was several
   hundred separate draw calls. Now a link is sorted into one of twelve
   buckets, four brightness bands across three tints, and each bucket is
   drawn as a single path with one stroke. Twelve draw calls, whatever
   the star count.

   The three tints are the "lamp" effect: a link far from the pointer
   is paper, a link near it is gold, and the middle one keeps the
   transition from being a hard switch. */
const LINK_BANDS = 4;
const LINK_ALPHA = 0.2;
const LINK_TINTS = [PAPER_RGB, "248, 206, 140", ACCENT_RGB];

function random(min, max) {
  return min + Math.random() * (max - min);
}

function lerp(pair, t) {
  return pair[0] + (pair[1] - pair[0]) * t;
}

/* Canvas only, never SVG or DOM nodes per particle: canvas is the one
   of the three that stays cheap once there are hundreds of moving
   points redrawn every frame.

   Pauses entirely under reduced motion (the effect below never
   starts, the canvas sits empty), and pauses via IntersectionObserver
   whenever the section scrolls out of view, since redrawing a canvas
   nobody can see is wasted work rather than a real effect.

   The whole star pass runs in "lighter" compositing so overlapping
   halos add rather than paint over each other. That is where the
   shimmer comes from, and it costs nothing. It has to be reset to
   source-over at the end of the frame or the next clearRect behaves
   unpredictably.

   Pointer tracking listens on the canvas's own parent element, not
   the canvas itself: the canvas has pointer-events: none so it never
   intercepts clicks meant for anything layered above it. */
export default function PlexusField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const container = canvas.parentElement;

    let stars = [];
    let dust = [];
    let width = 0;
    let height = 0;
    let raf = null;
    let running = false;
    let holding = false;
    let shoot = null;
    let nextShoot = performance.now() + SHOOT_FIRST_MS;

    let pointerSpeed = 0;
    let moveAccum = 0;
    const mouse = { x: -9999, y: -9999, lastX: 0, lastY: 0, seen: false };

    function makeSprite(coreRgb) {
      const s = document.createElement("canvas");
      s.width = SPRITE_PX;
      s.height = SPRITE_PX;
      const c = s.getContext("2d");
      const half = SPRITE_PX / 2;
      const g = c.createRadialGradient(half, half, 0, half, half, half);
      g.addColorStop(0, "rgba(255, 255, 255, 1)");
      g.addColorStop(0.07, `rgba(${coreRgb}, 0.95)`);
      g.addColorStop(0.2, `rgba(${ACCENT_RGB}, 0.4)`);
      g.addColorStop(0.46, `rgba(${ACCENT_RGB}, 0.1)`);
      g.addColorStop(1, `rgba(${ACCENT_RGB}, 0)`);
      c.fillStyle = g;
      c.fillRect(0, 0, SPRITE_PX, SPRITE_PX);
      return s;
    }

    // Two tints, both with a gold halo. The halo is what makes a cold
    // white star sit in a warm field instead of looking like a hole
    // punched in it.
    const spritePaper = makeSprite(PAPER_RGB);
    const spriteGold = makeSprite("255, 214, 140");

    // Built once. Twelve strings rather than twelve string
    // concatenations per frame.
    const linkStyles = [];
    for (let tint = 0; tint < LINK_TINTS.length; tint++) {
      const band = [];
      for (let b = 0; b < LINK_BANDS; b++) {
        band.push(`rgba(${LINK_TINTS[tint]}, ${(LINK_ALPHA * (b + 1)) / LINK_BANDS})`);
      }
      linkStyles.push(band);
    }

    // Reused every frame and emptied with length = 0 rather than
    // reallocated, so a 60fps loop is not handing the garbage
    // collector twelve new arrays a second.
    const buckets = [];
    for (let i = 0; i < LINK_TINTS.length * LINK_BANDS; i++) buckets.push([]);

    function makeStar(isDust) {
      const z = Math.random();
      return {
        x: random(0, width),
        y: random(0, height),
        z,
        vx: random(-SPEED, SPEED) * lerp(DEPTH_SPEED, z),
        vy: random(-SPEED, SPEED) * lerp(DEPTH_SPEED, z),
        kx: 0,
        ky: 0,
        r: random(STAR_MIN_R, STAR_MAX_R) * (isDust ? 0.5 : 1),
        swirl: Math.pow(Math.random(), SWIRL_BIAS) * (Math.random() < 0.5 ? -1 : 1),
        phase: random(0, Math.PI * 2),
        rate: random(TWINKLE_MIN, TWINKLE_MAX),
        sprite: Math.random() < GOLD_RATIO ? spriteGold : spritePaper,
        md: 9999,
      };
    }

    function resize() {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Both populations scale with the section's area rather than a
      // flat count, so a short header is not crowded and a tall wide
      // section is not sparse.
      const starCount = Math.max(STAR_MIN, Math.min(STAR_MAX, Math.round((width * height) / STAR_AREA)));
      const dustCount = Math.max(DUST_MIN, Math.min(DUST_MAX, Math.round((width * height) / DUST_AREA)));

      stars = Array.from({ length: starCount }, () => makeStar(false));
      dust = Array.from({ length: dustCount }, () => makeStar(true));

      // Sorted far to near once, never per frame. Depth never changes
      // after birth, so the draw order is correct forever.
      stars.sort((a, b) => a.z - b.z);
      dust.sort((a, b) => a.z - b.z);
    }

    function drift(p, drag) {
      p.x += p.vx + p.kx;
      p.y += p.vy + p.ky;
      p.kx *= drag;
      p.ky *= drag;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      p.x = Math.max(0, Math.min(width, p.x));
      p.y = Math.max(0, Math.min(height, p.y));
    }

    function draw(p, now, scale) {
      const twinkle = 1 - TWINKLE_DEPTH + TWINKLE_DEPTH * Math.sin(now * p.rate + p.phase);
      const near = p.md < REPEL_RADIUS ? 1 - p.md / REPEL_RADIUS : 0;
      const heat = Math.min(1, (p.kx * p.kx + p.ky * p.ky) * KE_GAIN);
      const size = p.r * lerp(DEPTH_SIZE, p.z) * scale * (0.92 + twinkle * 0.08 + near * 0.25 + heat * 0.15);
      ctx.globalAlpha = Math.min(1, lerp(DEPTH_ALPHA, p.z) * twinkle * (1 + near * 0.55 + heat * 0.9));
      ctx.drawImage(p.sprite, p.x - size / 2, p.y - size / 2, size, size);
    }

    function step() {
      const now = performance.now();

      // Pointer speed is accumulated by the move handler, which can
      // fire many times between frames, and consumed once here. Reading
      // it per event instead would sample whatever the last two events
      // happened to be.
      pointerSpeed = pointerSpeed * 0.82 + moveAccum * 0.18;
      moveAccum = 0;
      const rush = Math.min(1, pointerSpeed / SPEED_REF);
      const linkDist = LINK_DIST * (1 - SPEED_TIGHTEN * rush);

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (const p of dust) {
        drift(p, DRAG);
        draw(p, now, DUST_GLOW_SCALE);
      }

      const force = holding ? -ATTRACT_FORCE : REPEL_FORCE;
      const drag = holding ? HOLD_DRAG : DRAG;

      for (const p of stars) {
        drift(p, drag);

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        p.md = dist;

        if (dist < REPEL_RADIUS && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;

          // Tangential is the radial vector turned ninety degrees.
          // Mixed in per star, so the field has both straight shoves
          // and curls in it rather than one behaviour everywhere.
          const sx = nx - ny * p.swirl * SWIRL;
          const sy = ny + nx * p.swirl * SWIRL;
          const len = Math.hypot(sx, sy) || 1;

          // Softened inverse square, then WINDOWED to zero at the
          // radius. A hard cutoff means a star crossing the boundary
          // gets a full strength kick out of nowhere. The squared taper
          // brings the force smoothly to nothing, which molecular
          // dynamics calls a shifted-force cutoff.
          const falloff = (SOFTEN * SOFTEN) / (dist * dist + SOFTEN * SOFTEN);
          const taper = 1 - dist / REPEL_RADIUS;
          const amount = falloff * taper * taper * force * lerp(DEPTH_PUSH, p.z);
          p.kx += (sx / len) * amount;
          p.ky += (sy / len) * amount;

          const k = Math.hypot(p.kx, p.ky);
          if (k > KICK_MAX) {
            p.kx = (p.kx / k) * KICK_MAX;
            p.ky = (p.ky / k) * KICK_MAX;
          }
        }
      }

      for (const b of buckets) b.length = 0;

      for (let i = 0; i < stars.length; i++) {
        const a = stars[i];

        for (let j = i + 1; j < stars.length; j++) {
          const b = stars[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);

          // Equal and opposite, so the pair's combined momentum does not
          // change. Checked BEFORE the link cutoff below, because
          // SPACING is shorter than the link distance and the continue
          // would skip it.
          if (dist < SPACING && dist > 0.001) {
            const push = (1 - dist / SPACING) * SPACING_FORCE;
            const ux = dx / dist;
            const uy = dy / dist;
            a.kx += ux * push;
            a.ky += uy * push;
            b.kx -= ux * push;
            b.ky -= uy * push;
          }

          if (dist >= linkDist) continue;

          // The lamp: warmth comes from whichever END is closest to the
          // pointer, not the midpoint, so a link reaching out of the lit
          // area still glows at the near end rather than switching off.
          const closest = Math.min(a.md, b.md);
          const warmth = closest < CURSOR_LINK_DIST ? 1 - closest / CURSOR_LINK_DIST : 0;
          const tint = warmth > 0.62 ? 2 : warmth > 0.28 ? 1 : 0;

          const strength = (1 - dist / linkDist) * lerp(DEPTH_ALPHA, (a.z + b.z) / 2);
          const bandIdx = Math.min(LINK_BANDS - 1, Math.floor(strength * LINK_BANDS));

          const bucket = buckets[tint * LINK_BANDS + bandIdx];
          bucket.push(a.x, a.y, b.x, b.y);
        }

        // The cursor is one more node rather than something stars
        // chase: it draws toward stars already close, same rule, its
        // own reach. Holding brightens it, which is the only feedback
        // that the attract mode is on.
        if (a.md < CURSOR_LINK_DIST && mouse.seen) {
          const strength = (1 - a.md / CURSOR_LINK_DIST) * (holding ? 1 : 0.7);
          const bandIdx = Math.min(LINK_BANDS - 1, Math.floor(strength * LINK_BANDS));
          buckets[2 * LINK_BANDS + bandIdx].push(a.x, a.y, mouse.x, mouse.y);
        }
      }

      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
      for (let tint = 0; tint < LINK_TINTS.length; tint++) {
        for (let b = 0; b < LINK_BANDS; b++) {
          const seg = buckets[tint * LINK_BANDS + b];
          if (seg.length === 0) continue;
          ctx.strokeStyle = linkStyles[tint][b];
          ctx.beginPath();
          for (let k = 0; k < seg.length; k += 4) {
            ctx.moveTo(seg[k], seg[k + 1]);
            ctx.lineTo(seg[k + 2], seg[k + 3]);
          }
          ctx.stroke();
        }
      }

      for (const p of stars) draw(p, now, GLOW_SCALE);

      /* THE SHOOTING STAR is the only thing here that happens without a
         pointer, which makes it the only thing that does anything at
         all on a phone sitting still. */
      if (!shoot && now > nextShoot) {
        const fromLeft = Math.random() < 0.5;
        const angle = random(0.25, 0.6) * (fromLeft ? 1 : -1) + (fromLeft ? 0 : Math.PI);
        shoot = {
          x0: fromLeft ? random(-40, width * 0.4) : random(width * 0.6, width + 40),
          y0: random(-30, height * 0.45),
          ux: Math.cos(angle),
          uy: Math.sin(angle),
          reach: random(width * 0.5, width * 0.9),
          start: now,
        };
      }

      if (shoot) {
        const t = (now - shoot.start) / SHOOT_MS;
        if (t >= 1) {
          shoot = null;
          nextShoot = now + random(SHOOT_MIN_MS, SHOOT_MAX_MS);
        } else {
          const e = 1 - Math.pow(1 - t, 2);
          const x = shoot.x0 + shoot.ux * shoot.reach * e;
          const y = shoot.y0 + shoot.uy * shoot.reach * e;
          const fade = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88;

          const tailX = x - shoot.ux * SHOOT_TAIL;
          const tailY = y - shoot.uy * SHOOT_TAIL;
          const g = ctx.createLinearGradient(x, y, tailX, tailY);
          g.addColorStop(0, `rgba(255, 252, 244, ${0.85 * fade})`);
          g.addColorStop(0.35, `rgba(${ACCENT_RGB}, ${0.35 * fade})`);
          g.addColorStop(1, `rgba(${ACCENT_RGB}, 0)`);

          ctx.globalAlpha = 1;
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(x, y);
          ctx.stroke();

          ctx.globalAlpha = fade;
          ctx.drawImage(spritePaper, x - 13, y - 13, 26, 26);
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      if (running) raf = requestAnimationFrame(step);
    }

    function start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    }

    function handleMove(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (mouse.seen) moveAccum += Math.hypot(x - mouse.lastX, y - mouse.lastY);
      mouse.lastX = x;
      mouse.lastY = y;
      mouse.x = x;
      mouse.y = y;
      mouse.seen = true;
    }

    function handleDown() {
      holding = true;
    }

    function handleLeave() {
      holding = false;
      mouse.x = -9999;
      mouse.y = -9999;
      mouse.seen = false;
    }

    function handleUp() {
      holding = false;
    }

    resize();
    window.addEventListener("resize", resize);

    /* POINTER EVENTS, NOT MOUSE EVENTS. A finger dragging across the
       section fires pointermove; mousemove fires once as a synthesized
       event after a tap and never during the drag, so on a phone the
       field would sit inert.

       Nothing here calls preventDefault, so vertical scrolling is
       untouched and hold to attract costs the page nothing. pointerup
       and pointercancel both release, because pointerleave does not
       fire when a finger lifts, and pointercancel is what fires when
       the browser takes a gesture over for scrolling. */
    container.addEventListener("pointermove", handleMove, { passive: true });
    container.addEventListener("pointerdown", handleDown, { passive: true });
    container.addEventListener("pointerup", handleUp);
    container.addEventListener("pointerleave", handleLeave);
    container.addEventListener("pointercancel", handleLeave);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) start();
        else stop();
      },
      { threshold: 0.05 },
    );
    observer.observe(container);

    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener("resize", resize);
      container.removeEventListener("pointermove", handleMove);
      container.removeEventListener("pointerdown", handleDown);
      container.removeEventListener("pointerup", handleUp);
      container.removeEventListener("pointerleave", handleLeave);
      container.removeEventListener("pointercancel", handleLeave);
    };
  }, []);

  return <canvas className="plexus-fx" ref={canvasRef} aria-hidden="true" />;
}