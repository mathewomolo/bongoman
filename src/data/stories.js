// =====================================================================
// THE STORY FEED
// =====================================================================
// This is the only file you edit to change what shows in the feed.
// Change it, commit, push, and Cloudflare rebuilds in about two minutes.
//
// Each entry in STORIES is one ring in the tray. Tapping a ring plays
// its `items` in order, the way a WhatsApp status does.
//
// ---------------------------------------------------------------------
// ADDING MATERIAL
// ---------------------------------------------------------------------
// Put files in  public/images/stories/  and reference them from the
// site root, so a file at
//     public/images/stories/potion-p14.jpg
// is written here as
//     "/images/stories/potion-p14.jpg"
//
// An item is either:
//   { type: "image", src: "/images/stories/x.jpg", caption: "..." }
//   { type: "video", src: "/images/stories/x.mp4", caption: "..." }
//   { type: "text",  tint: "var(--color-gold)",   caption: "..." }
//
// The `text` type needs no file at all: it renders as a coloured panel
// with the caption lettered across it. Handy for a title card at the
// front of a set, and it is what the placeholder entries below use so
// the feed works before you have uploaded anything.
//
// ---------------------------------------------------------------------
// PRACTICAL NOTES
// ---------------------------------------------------------------------
// Shape:    portrait suits the viewer best, roughly 9:16. Comic pages
//           are usually taller than that and will letterbox rather than
//           crop, so nothing gets cut off. A single panel cropped out of
//           a page reads far better on a phone than a whole page does.
// Size:     keep images under about 400KB. These load over mobile data.
// Video:    short, 5 to 15 seconds, and MUXED WITHOUT SOUND or with
//           sound you do not mind being muted, since browsers refuse to
//           autoplay audio. Under 3MB. Longer than that belongs on
//           YouTube with a link rather than in here.
// Order:    newest set first. The tray reads left to right and people
//           tap the first ring far more than the last.
// How many: five to eight rings is the sweet spot. More than that and
//           the tray stops feeling curated.
// =====================================================================

export const STORIES = [
  {
    id: "welcome",
    label: "Start here",
    // The ring thumbnail. Same rules as an item `src`. With no cover
    // set, the ring falls back to the tint below.
    cover: null,
    tint: "var(--color-gold)",
    items: [
      {
        type: "text",
        tint: "var(--color-gold)",
        caption: "PLACEHOLDER. Swap these for real pages, screenshots and clips.",
      },
      {
        type: "text",
        tint: "var(--color-action-red)",
        caption: "Everything here is edited in src/data/stories.js",
      },
    ],
  },
  {
    id: "pages",
    label: "From the books",
    cover: null,
    tint: "var(--color-action-red)",
    items: [
      {
        type: "text",
        tint: "var(--color-action-red)",
        caption: "PLACEHOLDER. Panels lifted from the comics. Eleven books, seventy-odd pages each.",
      },
    ],
  },
  {
    id: "build",
    label: "In progress",
    cover: null,
    tint: "var(--color-savanna)",
    items: [
      {
        type: "text",
        tint: "var(--color-savanna)",
        caption: "PLACEHOLDER. Game screenshots, animation tests, work in progress.",
      },
    ],
  },
  {
    id: "desk",
    label: "Kham's desk",
    cover: null,
    tint: "var(--color-clay)",
    items: [
      {
        type: "text",
        tint: "var(--color-clay)",
        caption: "PLACEHOLDER. Sketches, roughs, and the things that never made it in.",
      },
    ],
  },
];

// How long a still image or text panel holds before advancing, in
// milliseconds. Videos ignore this and advance when they finish.
export const ITEM_DURATION = 5000;