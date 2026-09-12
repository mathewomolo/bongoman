import { motion } from "framer-motion";
import "./Trailer.css";

/* =========================================================
   The trailer: a YouTube embed that loops.

   TWO PARAMETERS, NOT ONE
   -----------------------
   `loop=1` on its own does nothing for a single video. YouTube
   implements single-video looping as a one-item playlist, so it
   only works alongside `playlist=<the same id>`. Drop the
   playlist parameter and the embed plays once and stops, with
   no error and nothing in the console to explain it.

   NO AUTOPLAY, DELIBERATELY
   -------------------------
   Every browser refuses to autoplay a video with sound, so an
   autoplaying trailer is a silent trailer, and a trailer's cut
   and its sound are the product. It waits on its poster frame,
   plays with sound when someone asks for it, and loops from
   then on.

   To run it as muted ambience instead: add `autoplay=1&mute=1`
   to PARAMS below. Both, not one. autoplay without mute is
   refused.

   NOCOOKIE DOMAIN
   ---------------
   youtube-nocookie.com serves the same player and sets no
   tracking cookie until somebody actually presses play.
   ========================================================= */

// PLACEHOLDER: the eleven-character YouTube video ID, the part after
// `v=` in a watch URL. Replace this one string and the embed is live.
const TRAILER_ID = "REPLACE_WITH_YOUTUBE_ID";

// The frame renders a labelled stand-in until a real ID goes in, so the
// layout can be checked before the trailer exists. Written as a function
// rather than a top-level comparison of two literals, which oxlint reads
// as a constant expression and flags.
function isPlaceholder(id) {
  return !id || id.startsWith("REPLACE_WITH");
}

// rel=0            related videos at the end come from this channel only
// modestbranding=1 less YouTube chrome over the picture
// playsinline=1    iOS plays it in the frame rather than taking the screen
const PARAMS = "rel=0&modestbranding=1&playsinline=1";

function embedSrc(id) {
  return `https://www.youtube-nocookie.com/embed/${id}?loop=1&playlist=${id}&${PARAMS}`;
}

export default function Trailer() {
  const pending = isPlaceholder(TRAILER_ID);

  return (
    <motion.div
      className="trailer"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <div className="trailer__frame">
        {pending ? (
          <div className="trailer__pending">
            <span className="trailer__pending-label">Trailer</span>
            <span className="trailer__pending-note">
              YouTube embed, 16:9. Set TRAILER_ID in Trailer.jsx.
            </span>
          </div>
        ) : (
          <iframe
            className="trailer__player"
            src={embedSrc(TRAILER_ID)}
            title="BONGOMAN trailer"
            /* `fullscreen` in the allow list and allowFullScreen as an
               attribute are two separate permissions and browsers want
               both. `autoplay` is listed even though the embed does not
               autoplay, because the loop restart counts as programmatic
               playback once someone has pressed play. */
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            /* The section sits well below the fold and the YouTube player
               is most of a megabyte. Lazy means that cost is only paid by
               someone who scrolls far enough to see it. */
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </div>
    </motion.div>
  );
}