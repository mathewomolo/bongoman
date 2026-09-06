import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ITEM_DURATION, STORIES } from "../data/stories.js";
import "./StoryFeed.css";

// One frame of a story: a photo, a clip, or a plain coloured panel.
// Videos are muted and playsInline because every mobile browser refuses
// to autoplay otherwise, and an unmuted autoplay would be obnoxious
// anyway. `onEnded` is what advances the story, so a clip runs its full
// length rather than being cut off by the still-image timer.
function StoryFrame({ item, onEnded, paused }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) video.pause();
    else video.play().catch(() => {});
  }, [paused]);

  if (item.type === "video") {
    return (
      <video
        ref={videoRef}
        className="storyframe storyframe--video"
        src={item.src}
        muted
        playsInline
        autoPlay
        onEnded={onEnded}
      />
    );
  }

  if (item.type === "image") {
    // `contain` rather than `cover`: comic pages are taller than the
    // viewer, and cropping one loses panels. Letterboxing is the lesser
    // evil when the artwork is the content.
    return <img className="storyframe storyframe--image" src={item.src} alt={item.caption || ""} />;
  }

  return (
    <div className="storyframe storyframe--text" style={{ background: item.tint }}>
      <span className="storyframe__lettering comic-outline">{item.caption}</span>
    </div>
  );
}

function StoryViewer({ story, onClose, onNextStory, onPrevStory }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const closeRef = useRef(null);

  const item = story.items[index];
  const isVideo = item?.type === "video";

  const next = useCallback(() => {
    setIndex((i) => {
      if (i + 1 < story.items.length) return i + 1;
      onNextStory();
      return i;
    });
  }, [story.items.length, onNextStory]);

  const prev = useCallback(() => {
    setIndex((i) => {
      if (i > 0) return i - 1;
      onPrevStory();
      return i;
    });
  }, [onPrevStory]);

  // No effect is needed to reset to the first frame when a different
  // story opens: the parent keys this component by story id, so
  // switching stories remounts it and useState(0) above does the job.

  // The auto-advance clock. Videos are excluded because they advance
  // themselves on `ended`. It is also skipped entirely when the visitor
  // has asked for reduced motion: content that moves on by itself is
  // exactly what that setting is about, so they drive it by tapping.
  useEffect(() => {
    if (paused || isVideo || reduceMotion) return;
    const timer = setTimeout(next, ITEM_DURATION);
    return () => clearTimeout(timer);
  }, [index, paused, isVideo, reduceMotion, next]);

  // Keyboard support, and focus moved into the dialog on open so a
  // keyboard or screen reader user is not left behind on the page.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, next, prev]);

  return (
    <motion.div
      className="storyviewer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${story.label}, item ${index + 1} of ${story.items.length}`}
    >
      <div className="storyviewer__stage">
        {/* One segment per frame: filled for what you have seen,
            animating for the current one, empty ahead. Keyed on the
            index so the fill restarts cleanly on every advance. */}
        <div className="storyviewer__progress">
          {story.items.map((_, i) => (
            <span key={i} className="storyviewer__bar">
              <motion.span
                className="storyviewer__bar-fill"
                initial={{ width: i < index ? "100%" : "0%" }}
                animate={{ width: i < index ? "100%" : i === index ? "100%" : "0%" }}
                transition={
                  i === index && !isVideo && !reduceMotion
                    ? { duration: paused ? 0 : ITEM_DURATION / 1000, ease: "linear" }
                    : { duration: 0 }
                }
              />
            </span>
          ))}
        </div>

        <div className="storyviewer__head">
          <span className="storyviewer__label">{story.label}</span>
          <button
            type="button"
            className="storyviewer__close"
            onClick={onClose}
            ref={closeRef}
            aria-label="Close"
          >
            &#10005;
          </button>
        </div>

        <StoryFrame item={item} onEnded={next} paused={paused} />

        {item.caption && item.type !== "text" && (
          <p className="storyviewer__caption">{item.caption}</p>
        )}

        {/* Tap the left third to go back, the right two thirds forward,
            which is the gesture people already know from every story
            feed. Holding anywhere pauses. */}
        <button
          type="button"
          className="storyviewer__zone storyviewer__zone--prev"
          onClick={prev}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
          aria-label="Previous"
        />
        <button
          type="button"
          className="storyviewer__zone storyviewer__zone--next"
          onClick={next}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
          aria-label="Next"
        />
      </div>
    </motion.div>
  );
}

export default function StoryFeed() {
  const [openIndex, setOpenIndex] = useState(null);
  // Rings dim once opened, the same read as a status you have already
  // watched. Kept in memory only, so it resets on reload.
  const [seen, setSeen] = useState(() => new Set());

  const open = (i) => {
    setOpenIndex(i);
    setSeen((prev) => new Set(prev).add(STORIES[i].id));
  };

  const close = () => setOpenIndex(null);

  const nextStory = useCallback(() => {
    setOpenIndex((i) => {
      if (i === null) return null;
      const nextIdx = i + 1;
      if (nextIdx >= STORIES.length) return null;
      setSeen((prev) => new Set(prev).add(STORIES[nextIdx].id));
      return nextIdx;
    });
  }, []);

  const prevStory = useCallback(() => {
    setOpenIndex((i) => (i === null || i === 0 ? i : i - 1));
  }, []);

  // The page must not scroll behind an open full-screen viewer.
  useEffect(() => {
    if (openIndex === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [openIndex]);

  return (
    <section className="storyfeed" id="feed">
      <div className="container">
        <motion.p
          className="eyebrow storyfeed__eyebrow"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          The Feed
        </motion.p>

        <motion.h2
          className="storyfeed__heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Straight from the desk.
        </motion.h2>

        <motion.p
          className="storyfeed__sub"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Pages from the books, shots from the game, and whatever else is on the table this
          week. Tap through. It changes.
        </motion.p>

        <motion.ul
          className="storyfeed__tray"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        >
          {STORIES.map((story, i) => (
            <motion.li
              key={story.id}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.85 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: "spring", stiffness: 300, damping: 18 },
                },
              }}
            >
              <button
                type="button"
                className={`storyring${seen.has(story.id) ? " storyring--seen" : ""}`}
                onClick={() => open(i)}
                aria-label={`Open ${story.label}, ${story.items.length} item${story.items.length === 1 ? "" : "s"}`}
              >
                <span className="storyring__ring">
                  <span className="storyring__inner" style={{ background: story.tint }}>
                    {story.cover && <img src={story.cover} alt="" loading="lazy" />}
                  </span>
                </span>
                <span className="storyring__label">{story.label}</span>
              </button>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <StoryViewer
            key={STORIES[openIndex].id}
            story={STORIES[openIndex]}
            onClose={close}
            onNextStory={nextStory}
            onPrevStory={prevStory}
          />
        )}
      </AnimatePresence>
    </section>
  );
}