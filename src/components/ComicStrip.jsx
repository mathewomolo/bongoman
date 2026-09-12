import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SCHEDULE, SERIES } from "../data/comics.js";
import "./ComicStrip.css";

/* =========================================================
   The weekly comic strip.

   ADDING NEXT WEEK'S SLICE IS: drop a PNG into
   src/comics/<series-slug>/<release-date>.png and commit.
   Nothing in this file changes. Ever.

   HOW THAT WORKS
   --------------
   import.meta.glob is a Vite feature that resolves a folder
   pattern at BUILD time into a real map of files. So the build
   itself is what discovers the strips; there is no manifest to
   maintain and no server to ask.

   This is also why the images live in src/comics/ rather than
   public/. Files in public/ are copied verbatim and are
   invisible to the build, so they cannot be globbed. Files in
   src/ go through the asset pipeline, which content-hashes them
   as a bonus, so caching takes care of itself.

   THE FILENAME DOES TWO JOBS
   --------------------------
   The release date IS the filename. Sorting ISO dates as plain
   strings gives correct chronological order with no date
   parsing at all, and comparing against today gives the release
   gate in one line. Queue three months of strips in one commit
   and readers get one more each week without you touching
   anything.

   Two slices in one week: 2026-09-14b.png. Still sorts right.

   A CURTAIN, NOT A LOCK. A queued slice is in the deployed
   bundle. Its filename is content-hashed so it is not guessable,
   but a determined person could find it. That is the honest
   limit of gating on a static site. If a strip must not exist
   until release day, the only real answer is not committing it
   until then.
   ========================================================= */

// PLACEHOLDER: four labelled 1000x320 stand-ins. Two dated in the past so
// they are released, two in the future so the gate can be seen working.
// Real slices drop in at the same shape of name.
//
// The pattern must be a static string literal. Vite reads it at build
// time, so it cannot be built from a variable.
const FILES = import.meta.glob("../comics/**/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

// e.g. ../comics/bongoman-and-the-elixir-of-youth/2026-09-14b.png
const PATH = /\/comics\/([^/]+)\/(\d{4}-\d{2}-\d{2})([a-z]?)\.png$/;

// Local date, NOT toISOString(). toISOString converts to UTC, so anyone
// east of Greenwich would see next week's strip appear hours early and
// anyone west would see it hours late. Building the string from the
// local parts keeps "today" meaning the reader's today.
function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Every released slice, grouped by series, oldest first.
function buildSeries() {
  const today = todayISO();
  const bySlug = {};

  for (const [path, url] of Object.entries(FILES)) {
    const match = PATH.exec(path);
    if (!match) continue;

    const [, slug, date, suffix] = match;
    if (!SERIES[slug]) continue;

    const list = (bySlug[slug] ||= { released: [], total: 0 });
    list.total += 1;
    if (date <= today) list.released.push({ key: date + suffix, url });
  }

  return Object.entries(bySlug)
    .map(([slug, data]) => ({
      slug,
      title: SERIES[slug].title,
      // An explicit `parts` wins, so a story can announce that it runs
      // longer than what has been drawn so far.
      total: SERIES[slug].parts ?? data.total,
      slices: data.released.sort((a, b) => a.key.localeCompare(b.key)),
    }))
    .filter((s) => s.slices.length > 0)
    .sort((a, b) => {
      const last = (s) => s.slices[s.slices.length - 1].key;
      return last(b).localeCompare(last(a));
    });
}

const STORAGE_PREFIX = "bongoman.comic.";

export default function ComicStrip() {
  const series = useMemo(buildSeries, []);
  const [seriesIndex, setSeriesIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const trackRef = useRef(null);

  const current = series[seriesIndex];

  // Where the reader left off, per series.
  //
  // A first time reader lands on part 1, because this is a continuing
  // story and dropping someone on the latest slice means reading the
  // ending first. A returning reader lands where they stopped.
  //
  // Wrapped in try/catch because localStorage throws outright in a
  // private window and in some embedded previews, and a comic strip
  // failing to render over a bookmark is not a trade worth making.
  useEffect(() => {
    if (!current) return;
    let saved = 0;
    try {
      const raw = window.localStorage.getItem(STORAGE_PREFIX + current.slug);
      if (raw !== null) saved = Math.min(parseInt(raw, 10) || 0, current.slices.length - 1);
    } catch {
      saved = 0;
    }
    setIndex(saved);
    // Jumped, not smooth-scrolled. An animated scroll on first paint
    // looks like the page is broken rather than like a feature.
    trackRef.current?.scrollTo({ left: trackRef.current.clientWidth * saved, behavior: "auto" });
  }, [current]);

  useEffect(() => {
    if (!current) return;
    try {
      window.localStorage.setItem(STORAGE_PREFIX + current.slug, String(index));
    } catch {
      /* nothing to do, the strip still works */
    }
  }, [current, index]);

  // The scroll position is the source of truth for which slice is
  // showing, not a click handler. That way a swipe, a trackpad flick, a
  // button press and a keyboard scroll all keep the header honest
  // without each needing its own bookkeeping.
  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  const go = useCallback((delta) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * delta, behavior: "smooth" });
  }, []);

  // Nothing drawn yet, or everything still queued. Render nothing rather
  // than an empty frame: a section that is not ready should be absent,
  // not broken.
  if (!current) return null;

  const atStart = index <= 0;
  const atEnd = index >= current.slices.length - 1;

  return (
    <section className="comic" id="comic">
      <div className="container">
        <motion.p
          className="eyebrow comic__eyebrow"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          The Strip
        </motion.p>

        <div className="comic__head">
          <div>
            <motion.h2
              className="comic__heading"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              {current.title}
            </motion.h2>
            <p className="comic__meta">
              Part {index + 1} of {current.total}
              <span className="comic__schedule">{SCHEDULE}</span>
            </p>
          </div>

          {/* The archive picker writes itself into existence. With one
              series there is nothing to choose between, so it does not
              render at all. Start a second series and it appears, with
              no code change. */}
          {series.length > 1 && (
            <label className="comic__picker">
              <span className="comic__picker-label">Series</span>
              <select
                value={seriesIndex}
                onChange={(e) => setSeriesIndex(Number(e.target.value))}
              >
                {series.map((s, i) => (
                  <option key={s.slug} value={i}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      {/* OUTSIDE .container. The track is the full width of the viewport
          so one slice fills the screen edge to edge, which is what makes
          the next one feel like it is waiting just off the side rather
          than sitting in a widget. */}
      <div className="comic__rail">
        <div className="comic__track" ref={trackRef} onScroll={onScroll}>
          {current.slices.map((slice, i) => (
            <div className="comic__panel" key={slice.key}>
              <img
                className="comic__image"
                src={slice.url}
                alt={`${current.title}, part ${i + 1}`}
                width="1000"
                height="320"
                /* The first one eagerly, the rest on demand. A reader
                   who never swipes never downloads slice 40. */
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="comic__arrow comic__arrow--prev"
          onClick={() => go(-1)}
          disabled={atStart}
          aria-label="Previous part"
        >
          {"\u2190"}
        </button>
        <button
          type="button"
          className="comic__arrow comic__arrow--next"
          onClick={() => go(1)}
          disabled={atEnd}
          aria-label="Next part"
        >
          {"\u2192"}
        </button>
      </div>

      <div className="container">
        <p className="comic__hint">
          {atEnd
            ? "That is everything so far. Come back next week."
            : "Swipe, or use the arrows, to keep reading."}
        </p>
      </div>
    </section>
  );
}