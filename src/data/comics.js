/* =========================================================
   Comic series titles.

   THIS IS THE ONLY FILE YOU TOUCH WHEN A NEW SERIES STARTS.

   Adding a weekly slice needs no code change at all: drop the
   PNG into src/comics/<slug>/<release-date>.png and commit.
   The component finds it at build time.

   Starting a NEW series needs one entry here, because a folder
   called "bongoman-and-the-elixir-of-youth" does not reverse
   into "Bongoman and the Elixir of Youth" reliably enough to
   put a title on a public page.

   The key must match the folder name under src/comics/ exactly.

   `parts` is optional. Leave it out and the header counts the
   files in the folder, which is right when you upload the whole
   story. Set it when you know a story runs longer than what you
   have drawn so far, so the header says "Part 2 of 12" rather
   than "Part 2 of 2".
   ========================================================= */

export const SERIES = {
  "bongoman-and-the-elixir-of-youth": {
    title: "Bongoman and the Elixir of Youth",
  },
};

// Shown under the header. Change it if the schedule changes, delete the
// line in ComicStrip.jsx if you would rather not promise a day.
export const SCHEDULE = "A new slice every Monday";