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
// front of a set.
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
//
// ---------------------------------------------------------------------
// CURRENT STATE
// ---------------------------------------------------------------------
// PLACEHOLDER: every `src` below points at the labelled stand-in images
// in public/images/stories/. They are the six 1080x1920 files from the
// placeholder set, not real comic pages. Replace the files, keep the
// paths, and nothing here needs editing. Or replace the paths with your
// own filenames, which is the better habit once real material lands,
// since "story-04" tells you nothing a year from now.
//
// The `cover` on each ring is the little circular thumbnail in the tray.
// It crops to a circle, so whatever is in the middle of that image is
// what people see at 76px.
// =====================================================================

export const STORIES = [
  {
    id: "welcome",
    label: "Start here",
    // The ring thumbnail. Same rules as an item `src`. With no cover
    // set, the ring falls back to the tint below.
    cover: "/images/stories/story-01.jpg",
    tint: "var(--color-gold)",
    items: [
      {
        type: "image",
        src: "/images/stories/story-01.jpg",
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
    cover: "/images/stories/story-02.jpg",
    tint: "var(--color-action-red)",
    items: [
      {
        type: "image",
        src: "/images/stories/story-02.jpg",
        caption: "PLACEHOLDER. Panels lifted from the comics.",
      },
      {
        type: "image",
        src: "/images/stories/story-03.jpg",
        caption: "Eleven books. Seventy-odd pages each.",
      },
      {
        type: "text",
        tint: "var(--color-gold)",
        caption: "Crop a single panel. A whole page is unreadable on a phone.",
      },
    ],
  },
  {
    id: "build",
    label: "In progress",
    cover: "/images/stories/story-04.jpg",
    tint: "var(--color-savanna)",
    items: [
      {
        type: "image",
        src: "/images/stories/story-04.jpg",
        caption: "PLACEHOLDER. Screenshots straight out of the build.",
      },
      {
        type: "image",
        src: "/images/stories/story-05.jpg",
        caption: "Animation tests belong here too. Short, silent, under 3MB.",
      },
      {
        type: "text",
        tint: "var(--color-action-red)",
        caption: "Rough and unfinished is the point. People like seeing the seams.",
      },
    ],
  },
  {
    id: "desk",
    label: "Kham's desk",
    cover: "/images/stories/story-06.jpg",
    tint: "var(--color-clay)",
    items: [
      {
        type: "image",
        src: "/images/stories/story-06.jpg",
        caption: "PLACEHOLDER. Sketches, roughs, and the things that never made it in.",
      },
      {
        type: "text",
        tint: "var(--color-gold)",
        caption: "Thirty-seven years of drawing this character.",
      },
    ],
  },
];

// How long a still image or text panel holds before advancing, in
// milliseconds. Videos ignore this and advance when they finish.
export const ITEM_DURATION = 5000;