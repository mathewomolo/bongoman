# BONGOMAN — Website (WIP)

Interactive marketing/showcase site for BONGOMAN, built section by section.

## Run it locally

```bash
npm install
npm run dev
```

Then open the local URL it prints (usually `http://localhost:5173`).

## What's built so far

- **Foundation** — design tokens (color, type) in `src/index.css`: dark "ink" base, gold/red/savanna/clay accent palette, Anton (display) + Barlow (body/condensed) fonts, comic-outline text utility, halftone texture utility.
- **Hero** (`src/components/Hero.jsx` + `Hero.css`) — title treatment, tagline, scroll-linked parallax (sun, skyline, birds move at different speeds as you scroll; content fades out as you scroll past).

Everything drawn in the hero (skyline, sun, birds) is a **placeholder** built from CSS/SVG shapes — no real art exists yet. They're flagged in code comments so it's obvious what to swap out once you export real illustrations/game captures. Swapping them for real art won't require touching the scroll/parallax wiring.

## Next up

Origin Story → The Game → The World → Ebooks → CTA/footer, one section at a time — see the project's `build-plan.md` doc for the full plan and content source (`media-kit-content.md`).
