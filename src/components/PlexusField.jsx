import { useEffect, useRef } from "react";
import "./PlexusField.css";

const MAX_LINK_DIST = 140;    // px, lines only drawn between particles within this
const CURSOR_LINK_DIST = 180; // px, cursor reaches slightly further than particles reach each other
const SPEED = 0.18;           // px per frame, slow drift
const DPR_CAP = 2;            // caps device pixel ratio so a very high-DPI screen does not multiply draw cost
const REPEL_RADIUS = 90;      // px, how close the cursor has to be before it pushes a particle
const REPEL_STRENGTH = 2.4;   // px pushed per frame at the closest possible range
const GLOW_BASE = 5;          // px shadow blur at rest
const GLOW_NEAR = 11;         // extra px shadow blur added at the closest possible range

// The accent, as raw channels so alpha can be varied per line and per
// dot. Canvas cannot read a CSS custom property, so this is the one
// place --color-gold (#f2a93b) is duplicated. Change it here if the
// token ever changes, and nowhere else in this file.
const ACCENT_RGB = "242, 169, 59";

function random(min, max) {
  return min + Math.random() * (max - min);
}

/* A light plexus/particle field, canvas only, never SVG or DOM nodes
   per particle: canvas is the one of the three that stays cheap once
   there are dozens of moving points redrawn every frame.

   Ported from the Erevuka build, with two deliberate differences.

   NO AMBIENT CURSOR GLOW. The Erevuka version marked its section with
   data-glow so a page-level CursorGlow element knew where it was
   allowed to show. This site already has CustomCursor, the eyeball
   that replaces the pointer, and a second element following the cursor
   would fight it. One cursor character per site, so the data-glow
   marking is gone rather than left in as a no-op.

   THE ACCENT IS GOLD, not Erevuka's cyan. It is a constant at the top
   rather than two hardcoded rgba() calls buried in the draw loop.

   Pauses entirely under reduced motion (the effect below just never
   starts, the canvas sits empty), and pauses via IntersectionObserver
   whenever the section scrolls out of view, since redrawing a canvas
   nobody can see is wasted work, not a real effect.

   The repel push is applied directly to position each frame, only
   while the cursor is within REPEL_RADIUS, rather than as an
   accumulating velocity change, so there is no momentum left over to
   decay once the cursor moves away.

   No (pointer: fine) gate, unlike CustomCursor. On a touch device the
   field still drifts and links as ambient background; the cursor
   simply never arrives, and mouse sits parked off canvas.

   Mouse tracking listens on the canvas's own parent element, not the
   canvas itself: the canvas has pointer-events: none so it never
   intercepts clicks meant for anything layered above it. */
export default function PlexusField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const container = canvas.parentElement;

    let particles = [];
    let width = 0;
    let height = 0;
    let raf = null;
    let running = false;
    const mouse = { x: -9999, y: -9999 };

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

      // Density scales with the section's area rather than a flat
      // count, so a short header does not end up crowded and a tall
      // wide section does not end up sparse.
      const target = Math.round((width * height) / 18000);
      const count = Math.max(18, Math.min(70, target));
      particles = Array.from({ length: count }, () => ({
        x: random(0, width),
        y: random(0, height),
        vx: random(-SPEED, SPEED),
        vy: random(-SPEED, SPEED),
      }));
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < REPEL_RADIUS && dist > 0.001) {
          const push = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          p.x += (dx / dist) * push;
          p.y += (dy / dist) * push;
        }
      }

      // Lines drawn with no shadow, set explicitly each frame rather
      // than assumed, or they would pick up whatever shadow the dot
      // pass below left set on the context.
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < MAX_LINK_DIST) {
            const alpha = 0.16 * (1 - dist / MAX_LINK_DIST);
            ctx.strokeStyle = `rgba(243, 236, 217, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        // The cursor acts as one more node rather than something
        // particles chase: it only draws toward particles already
        // close, same rule as particle to particle, just its own
        // colour and reach.
        const mdist = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (mdist < CURSOR_LINK_DIST) {
          const alpha = 0.4 * (1 - mdist / CURSOR_LINK_DIST);
          ctx.strokeStyle = `rgba(${ACCENT_RGB}, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      for (const p of particles) {
        const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        const proximity = dist < REPEL_RADIUS ? 1 - dist / REPEL_RADIUS : 0;
        ctx.shadowBlur = GLOW_BASE + proximity * GLOW_NEAR;
        ctx.shadowColor = `rgba(${ACCENT_RGB}, 0.9)`;
        ctx.fillStyle = `rgba(243, 236, 217, ${0.5 + proximity * 0.3})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 + proximity * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

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
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }

    function handleLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    resize();
    window.addEventListener("resize", resize);

    /* POINTER EVENTS, NOT MOUSE EVENTS. A finger dragging across the
       section fires pointermove; mousemove fires once as a synthesized
       event after a tap and never during the drag, so on a phone the
       field would sit inert.

       pointerup and pointercancel both reset, because pointerleave does
       not fire when a finger lifts. Without them one tap would leave the
       cursor node lit at that spot for good. pointercancel is the one
       that fires when the browser takes the gesture over for scrolling,
       which on a vertical drag is almost immediately. */
    container.addEventListener("pointermove", handleMove, { passive: true });
    container.addEventListener("pointerleave", handleLeave);
    container.addEventListener("pointerup", handleLeave);
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
      container.removeEventListener("pointerleave", handleLeave);
      container.removeEventListener("pointerup", handleLeave);
      container.removeEventListener("pointercancel", handleLeave);
    };
  }, []);

  return <canvas className="plexus-fx" ref={canvasRef} aria-hidden="true" />;
}