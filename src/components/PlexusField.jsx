import { useEffect, useRef } from "react";
import { plexusSignal } from "../lib/plexusSignal.js";
import "./PlexusField.css";

/* =========================================================
   TWO POPULATIONS, AND THE REASON FOR IT.

   The expensive part of a plexus is the PAIRS: every linking star is
   measured against every other, so doubling the count quadruples that
   loop. A star that only drifts and glows costs one drawImage.

   STARS link, react to the cursor, carry the web. DUST is the far
   layer: it drifts, it twinkles, it is never measured against anything
   and never reacts to the pointer. That is the depth story being
   honest. A star that far away does not move because you waved.

   THE THREE BUDGETS, measured on a roughly 1400x600 section:

     pair checks    4,753 at 105 stars. Grows as n squared. Trouble at
                    about 11,000, which is 150 stars.
     sprite stamps  498. Grows linearly. Trouble at about 800.
     additive fill  about 113,000 px2 of a 840,000 px2 section. Grows as
                    size squared. Trouble past about 340,000.

   Everything currently sits under half of every wall. Dust is the cheap
   way to add density because it never enters the pair loop.
   ========================================================= */

const DPR_CAP = 2;

const STAR_AREA = 8600;
const STAR_MIN = 26;
const STAR_MAX = 105;
const DUST_AREA = 2100;
const DUST_MIN = 60;
const DUST_MAX = 420;

const GOLD_RATIO = 0.45;

/* DEPTH. One number per star, 0 far and 1 near, driving five things at
   once. Each pair is [value at depth 0, value at depth 1]. */
const DEPTH_SIZE = [0.55, 1.15];
const DEPTH_ALPHA = [0.28, 1.0];
const DEPTH_SPEED = [0.45, 1.25];
const DEPTH_PUSH = [0.42, 1.0];

const SPEED = 0.18;
const STAR_MIN_R = 1.9;
const STAR_MAX_R = 4.4;

/* THE GLOW SPRITE replaces ctx.shadowBlur, which was by far the most
   expensive line in this file: a real gaussian blur, on the CPU in most
   browsers, recomputed per star per frame. One radial gradient rendered
   once into an offscreen canvas and stamped with drawImage is roughly
   ten times cheaper, and looks better, because a gradient is a real
   falloff rather than a blur of a hard circle.

   DO NOT REINTRODUCE shadowBlur IN THIS FILE.

   Fill turned out to be the roomiest of the three budgets, not the
   tightest as first assumed, which is why these are larger than they
   were. Area grows as the SQUARE of scale times radius, so doubling
   both is a factor of sixteen, not four. */
const SPRITE_PX = 64;
const GLOW_SCALE = 10.5;
const DUST_GLOW_SCALE = 7.0;

const TWINKLE_MIN = 0.0007;
const TWINKLE_MAX = 0.0032;
const TWINKLE_DEPTH = 0.4;

/* =========================================================
   PUSHING AND PULLING ARE NOT THE SAME FORCE.

   They used to share one law, and that was the fault behind nearly
   every complaint in the session that built this. A shove wants to be
   steep, local and impulsive. A gravity well wants to be shallow and
   wide, or a star falls in gaining speed the whole way and leaves the
   far side faster than it arrived. That is a hyperbolic flyby, and it
   is what "the stars just slingshot" was.

   Tuning one always broke the other, because they were one number.
   They are two now. IF ONE FEELS WRONG, CHECK THE FIX IS GOING INTO
   THE RIGHT LAW BEFORE TOUCHING ANYTHING.
   ========================================================= */

/* PUSH. Calibrated by Mathew. Force at 30 / 60 / 100 px is
   0.45 / 0.12 / 0.011. Do not retune without printing those first.

   SOFTEN is the softening length of the inverse square, the device real
   N-body simulations use to stop the force diverging at zero distance.
   At r = SOFTEN the force is exactly half its maximum.

   FALLOFF_EXP is the one knob for the outer half. At 100px: exponent 1
   gives 0.097, 2 gives 0.032, 3 gives 0.011, 4 gives 0.0036. Close
   range is 0.45 at every setting, which is the point of having it.

   THE REGRESSION TO NEVER REPEAT: an earlier pass used a softened
   inverse square AND a squared taper AND a shorter radius. Two falloffs
   multiplied together collapsed the field into a 30px bubble, five
   times weaker at 60px and forty-six times weaker at 100px than the
   version that worked. Everything interesting lives in the mid range. */
const REPEL_RADIUS = 150;
const REPEL_FORCE = 1.1;
const SOFTEN = 60;
const FALLOFF_EXP = 3;

/* Swirl is per star, magnitude raised to SWIRL_BIAS. Raising a number
   below one to a power pushes it toward zero, so most stars are born
   with almost none and get shoved straight out from behind, and a
   minority curl, in both directions. SWIRL of 0 makes every star go
   straight. This applies to PUSHING only. */
const SWIRL = 0.95;
const SWIRL_BIAS = 2.4;

/* PULL. A well with a repulsive core, not a point of attraction.

   Inside the core the pull becomes a push, so nothing reaches the
   centre and nothing can gain the speed that produced the slingshot.
   Same Lennard-Jones shape the stars already use on each other.

   Both branches are zero AT the core radius so the halves meet without
   a step, and `rise` ramps the pull in over the first core width above
   it rather than switching it on.

   THE CORE TIGHTENS WHILE YOU HOLD, from HOLD_CORE_MAX to
   HOLD_CORE_MIN over CORE_TIGHTEN_MS of unbroken holding, and the ring
   is drawn inward with it. A fixed core killed the slingshot but meant
   the stars circled at arm's length forever and never came in.

   IT NEVER REACHES ZERO. That is what keeps the slingshot gone: there
   is always a floor, and by then the stars are captured and damped, so
   there is no infall energy left to fling them with. HOLD_CORE_MIN of 0
   brings it straight back, and below about 10 the stars' own SPACING
   repulsion fights the core and they cannot get in at all.

   The angular momentum is free. A lap takes about 1.9s at 60px and
   about 0.4s at 12px, because tangential speed rises as the radius
   falls. That is the figure skater, and it is the payoff for holding.

   SPACING still applies between stars, so they gather as a turning
   swarm rather than collapsing onto one point. Deliberate: a single dot
   reads as a bug. */
const HOLD_REACH = 190;
const HOLD_CORE_MAX = 60;
const HOLD_CORE_MIN = 12;
const CORE_TIGHTEN_MS = 2600;
const HOLD_CORE_FORCE = 0.5;
const ATTRACT_FORCE = 0.2;
const ATTRACT_EXP = 2;

/* THE VORTEX IS ITS OWN FORCE, not the radial force rotated.

   Rotating the radial vector was the second half of the orbit problem:
   wherever the radial force went to zero the spin went with it, so at
   the exact radius where stars should have been circling there was
   nothing left to circle them. Independent, it peaks at the core radius
   and fades to nothing at the reach.

   Terminal tangential speed is HOLD_SPIN over (1 - HOLD_DRAG), about
   3.4px per frame here. That must stay under KICK_MAX, because a clamp
   distorts an orbit unevenly rather than simply capping it. The ceiling
   for HOLD_SPIN at this damping is therefore about 0.2. */
const HOLD_SPIN = 0.135;

/* ORBITS NEED FRICTION. This was 0.985, near frictionless, and an orbit
   that never loses energy is never captured: the star swings past and
   leaves. Real accretion disks form for exactly this reason. Ceiling is
   about 0.985; at 1.0 the slingshot returns. */
const HOLD_DRAG = 0.96;

/* Stars inside this radius count as held: they brighten, and their
   number drives the cursor's glow through plexusSignal.

   IF THIS OR THE STAR DENSITY CHANGES, RECOMPUTE CAPTURE_FULL IN
   CustomCursor.jsx. It was once set to 14 when only about nine stars
   could ever be in reach, so the glow topped out at 0.4 and looked
   deleted. At 105 stars roughly fourteen are inside HOLD_REACH. */
const CAPTURE_RADIUS = 95;

const DRAG = 0.92;

// Strobe wall is about 12: a star sprite is roughly 30px, and past
// that it moves more than its own width per frame and stops reading as
// travel.
const KICK_MAX = 7;

/* PERSONAL SPACE. Stars push each other apart below this distance,
   which is why even spacing survives everywhere rather than only in the
   ring around the cursor. The repulsive core of Lennard-Jones again,
   applied equally and oppositely, which is Newton's third law: push
   only one of a pair and the whole field slowly drifts off screen.

   SPACING_FORCE MUST STAY BELOW WHAT DRAG CAN ABSORB. At 0.2 a star
   with six neighbours gained 1.2 per frame against an 8 percent bleed,
   pinned at three times KICK_MAX, and the field boiled. Ceiling is
   about 0.027. Set to 0 to switch mutual repulsion off. */
const SPACING = 34;
const SPACING_FORCE = 0.018;

/* Brightness carries kinetic energy, which goes as v squared, so
   damping becomes VISIBLE: shove the field and watch heat bleed out
   over about a second. It rides mostly on alpha rather than size,
   because a bigger sprite is more pixels blended and under additive
   compositing the page pays for every one. */
const KE_GAIN = 0.12;

/* Pulled in from 140 when the star count went up by half. Average
   neighbours within the link distance would have gone from 5.1 to 7.2
   and the web would have read as a net rather than a constellation.
   At 125 it comes back to 5.7. */
const LINK_DIST = 125;
const CURSOR_LINK_DIST = 185;
const SPEED_REF = 26;
const SPEED_TIGHTEN = 0.2;

const SHOOT_FIRST_MS = 4200;
const SHOOT_MIN_MS = 12000;
const SHOOT_MAX_MS = 26000;
const SHOOT_MS = 950;
const SHOOT_TAIL = 130;

const PAPER_RGB = "243, 236, 217";
const ACCENT_RGB = "242, 169, 59";

/* LINK BUCKETS. Every link used to be its own beginPath and stroke, and
   a busy frame was several hundred draw calls. A link is now sorted
   into one of twelve buckets, four brightness bands across three tints,
   and each bucket is one path with one stroke. Twelve draw calls,
   whatever the star count. This is why raising STAR_MAX costs the pair
   loop and nothing else.

   The three tints are the lamp effect: a link far from the pointer is
   paper, a link near it is gold, and the middle keeps the transition
   from being a hard switch. */
const LINK_BANDS = 4;
const LINK_ALPHA = 0.2;
const LINK_TINTS = [PAPER_RGB, "248, 206, 140", ACCENT_RGB];

// One frame at 60Hz. Everything below is expressed per frame at that
// rate and then scaled by dt, so the existing tuning is preserved
// exactly on a 60Hz display.
const FRAME_MS = 1000 / 60;

function random(min, max) {
  return min + Math.random() * (max - min);
}

function lerp(pair, t) {
  return pair[0] + (pair[1] - pair[0]) * t;
}

/* Canvas only, never SVG or DOM nodes per particle.

   Pauses entirely under reduced motion, and via IntersectionObserver
   whenever the section scrolls out of view.

   The whole pass runs in "lighter" compositing so overlapping halos add
   rather than paint over each other. That is where the shimmer comes
   from and it costs nothing, but it must be reset to source-over at the
   end of every frame.

   HOW A PUSH IS AIMED. The repel pushes away from the cursor and harder
   the closer the star is, so driving star A toward B means putting the
   cursor behind A on the line through B. From the side it scatters.

   FRAME RATE. Every force and every drift is multiplied by dt, and the
   damping is raised to the power of dt. Before this, SPEED was px per
   FRAME and DRAG was a per frame multiplier, so on a 120Hz display the
   whole field ran at double speed and damped twice as fast: the tuning
   was calibrated to one monitor. dt is clamped between half and double
   a frame so a tab switch or a long hitch cannot explode the
   simulation with one enormous step. */
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
    let holdStart = 0;
    let lastFrame = 0;
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

      /* The gold has to be LOUD or the field reads as white with a warm
         edge, which is what the first version did: the gold band sat at
         0.4 alpha and was gone by 46 percent of the radius. */
      g.addColorStop(0, "rgba(255, 252, 240, 1)");
      g.addColorStop(0.06, `rgba(${coreRgb}, 0.98)`);
      g.addColorStop(0.15, `rgba(${ACCENT_RGB}, 0.78)`);
      g.addColorStop(0.34, `rgba(${ACCENT_RGB}, 0.3)`);
      g.addColorStop(0.62, `rgba(${ACCENT_RGB}, 0.07)`);
      g.addColorStop(1, `rgba(${ACCENT_RGB}, 0)`);
      c.fillStyle = g;
      c.fillRect(0, 0, SPRITE_PX, SPRITE_PX);
      return s;
    }

    const spritePaper = makeSprite(PAPER_RGB);
    const spriteGold = makeSprite("255, 214, 140");

    const linkStyles = [];
    for (let tint = 0; tint < LINK_TINTS.length; tint++) {
      const band = [];
      for (let b = 0; b < LINK_BANDS; b++) {
        band.push(`rgba(${LINK_TINTS[tint]}, ${(LINK_ALPHA * (b + 1)) / LINK_BANDS})`);
      }
      linkStyles.push(band);
    }

    // Reused and emptied with length = 0 rather than reallocated, so a
    // 60fps loop is not handing the collector twelve arrays a second.
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

      const starCount = Math.max(STAR_MIN, Math.min(STAR_MAX, Math.round((width * height) / STAR_AREA)));
      const dustCount = Math.max(DUST_MIN, Math.min(DUST_MAX, Math.round((width * height) / DUST_AREA)));

      stars = Array.from({ length: starCount }, () => makeStar(false));
      dust = Array.from({ length: dustCount }, () => makeStar(true));

      // Sorted far to near once. Depth never changes after birth, so
      // the draw order stays correct forever.
      stars.sort((a, b) => a.z - b.z);
      dust.sort((a, b) => a.z - b.z);
    }

    // dragPow is (drag ^ dt), computed once per frame for the whole
    // population rather than per star: Math.pow five hundred times a
    // frame is real work, and every star shares the value.
    function drift(p, dragPow, dt) {
      p.x += (p.vx + p.kx) * dt;
      p.y += (p.vy + p.ky) * dt;
      p.kx *= dragPow;
      p.ky *= dragPow;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      p.x = Math.max(0, Math.min(width, p.x));
      p.y = Math.max(0, Math.min(height, p.y));
    }

    function draw(p, now, scale) {
      const twinkle = 1 - TWINKLE_DEPTH + TWINKLE_DEPTH * Math.sin(now * p.rate + p.phase);
      const near = p.md < REPEL_RADIUS ? 1 - p.md / REPEL_RADIUS : 0;
      const heat = Math.min(1, (p.kx * p.kx + p.ky * p.ky) * KE_GAIN);

      // A star you are actually holding should look held. Free: md is
      // already measured and holding is already known.
      const caught = holding && p.md < CAPTURE_RADIUS ? 1 - p.md / CAPTURE_RADIUS : 0;

      const size =
        p.r *
        lerp(DEPTH_SIZE, p.z) *
        scale *
        (0.92 + twinkle * 0.08 + near * 0.25 + heat * 0.15 + caught * 0.5);
      ctx.globalAlpha = Math.min(
        1,
        lerp(DEPTH_ALPHA, p.z) * twinkle * (1 + near * 0.55 + heat * 0.9 + caught * 1.5),
      );
      ctx.drawImage(p.sprite, p.x - size / 2, p.y - size / 2, size, size);
    }

    function step() {
      const now = performance.now();
      const elapsed = lastFrame ? now - lastFrame : FRAME_MS;
      lastFrame = now;
      const dt = Math.max(0.5, Math.min(2, elapsed / FRAME_MS));

      // Accumulated by the move handler, which can fire several times
      // between frames, and consumed once here.
      pointerSpeed = pointerSpeed * 0.82 + moveAccum * 0.18;
      moveAccum = 0;
      const rush = Math.min(1, pointerSpeed / SPEED_REF);
      const linkDist = LINK_DIST * (1 - SPEED_TIGHTEN * rush);

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      const dustDrag = Math.pow(DRAG, dt);
      for (const p of dust) {
        drift(p, dustDrag, dt);
        draw(p, now, DUST_GLOW_SCALE);
      }

      const starDrag = Math.pow(holding ? HOLD_DRAG : DRAG, dt);
      const reach = holding ? HOLD_REACH : REPEL_RADIUS;

      // Smoothstepped rather than linear, so the collapse begins gently
      // and finishes decisively instead of closing at a constant rate.
      const th = holding ? Math.min(1, (now - holdStart) / CORE_TIGHTEN_MS) : 0;
      const core = HOLD_CORE_MAX + (HOLD_CORE_MIN - HOLD_CORE_MAX) * (th * th * (3 - 2 * th));

      let captured = 0;

      for (const p of stars) {
        drift(p, starDrag, dt);

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        p.md = dist;
        if (holding && dist < CAPTURE_RADIUS) captured += 1;

        if (dist < reach && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          const depth = lerp(DEPTH_PUSH, p.z);

          // Positive radial is outward. Spin is a separate term on the
          // perpendicular, never derived from radial.
          let radial;
          let spin;

          if (holding) {
            if (dist < core) {
              radial = HOLD_CORE_FORCE * (1 - dist / core);
            } else {
              const t = (dist - core) / (HOLD_REACH - core);
              const rise = Math.min(1, (dist - core) / core);
              radial = -ATTRACT_FORCE * rise * Math.pow(1 - t, ATTRACT_EXP);
            }
            // One shared direction while pulling. Mixed directions
            // collapsing inward read as chaos; one reads as a vortex.
            spin = HOLD_SPIN * Math.min(1, dist / core) * (1 - dist / HOLD_REACH);
          } else {
            const falloff = (SOFTEN * SOFTEN) / (dist * dist + SOFTEN * SOFTEN);
            const taper = Math.pow(1 - dist / REPEL_RADIUS, FALLOFF_EXP);
            radial = REPEL_FORCE * falloff * taper;
            spin = radial * p.swirl * SWIRL;
          }

          p.kx += (nx * radial - ny * spin) * depth * dt;
          p.ky += (ny * radial + nx * spin) * depth * dt;

          const k = Math.hypot(p.kx, p.ky);
          if (k > KICK_MAX) {
            p.kx = (p.kx / k) * KICK_MAX;
            p.ky = (p.ky / k) * KICK_MAX;
          }
        }
      }

      plexusSignal.captured = holding ? captured : 0;

      ctx.lineWidth = 1;
      for (const b of buckets) b.length = 0;

      for (let i = 0; i < stars.length; i++) {
        const a = stars[i];

        for (let j = i + 1; j < stars.length; j++) {
          const b = stars[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);

          // Checked BEFORE the link cutoff, because SPACING is shorter
          // than the link distance and the continue would skip it.
          if (dist < SPACING && dist > 0.001) {
            const push = (1 - dist / SPACING) * SPACING_FORCE * dt;
            const ux = dx / dist;
            const uy = dy / dist;
            a.kx += ux * push;
            a.ky += uy * push;
            b.kx -= ux * push;
            b.ky -= uy * push;
          }

          if (dist >= linkDist) continue;

          // Warmth comes from whichever END is nearest the pointer, not
          // the midpoint, so a link reaching out of the lit area still
          // glows at the near end rather than switching off.
          const closest = Math.min(a.md, b.md);
          const warmth = closest < CURSOR_LINK_DIST ? 1 - closest / CURSOR_LINK_DIST : 0;
          const tint = warmth > 0.62 ? 2 : warmth > 0.28 ? 1 : 0;

          const strength = (1 - dist / linkDist) * lerp(DEPTH_ALPHA, (a.z + b.z) / 2);
          const bandIdx = Math.min(LINK_BANDS - 1, Math.floor(strength * LINK_BANDS));
          buckets[tint * LINK_BANDS + bandIdx].push(a.x, a.y, b.x, b.y);
        }

        if (a.md < CURSOR_LINK_DIST && mouse.seen) {
          const strength = (1 - a.md / CURSOR_LINK_DIST) * (holding ? 1 : 0.7);
          const bandIdx = Math.min(LINK_BANDS - 1, Math.floor(strength * LINK_BANDS));
          buckets[2 * LINK_BANDS + bandIdx].push(a.x, a.y, mouse.x, mouse.y);
        }
      }

      ctx.globalAlpha = 1;
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

      // The only thing here that happens without a pointer, which makes
      // it the only thing that does anything on a phone sitting still.
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
          ctx.drawImage(spritePaper, x - 15, y - 15, 30, 30);
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      if (running) raf = requestAnimationFrame(step);
    }

    function start() {
      if (running) return;
      running = true;
      // Cleared so the first frame after a pause measures one frame
      // rather than however long the section was off screen.
      lastFrame = 0;
      raf = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      plexusSignal.captured = 0;
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
      holdStart = performance.now();
    }

    function handleUp() {
      holding = false;
      plexusSignal.captured = 0;
    }

    function handleLeave() {
      handleUp();
      mouse.x = -9999;
      mouse.y = -9999;
      mouse.seen = false;
    }

    resize();
    window.addEventListener("resize", resize);

    /* POINTER EVENTS, NOT MOUSE EVENTS. A finger dragging fires
       pointermove; mousemove fires once as a synthesized event after a
       tap and never during the drag, so on a phone the field would sit
       inert. Nothing calls preventDefault, so scrolling is untouched.
       pointerup and pointercancel both release, because pointerleave
       does not fire when a finger lifts. */
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