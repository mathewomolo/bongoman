# BONGOMAN art assets

62 placeholders, one for every image the site needs. All of them carry a visible
PLACEHOLDER stamp and the pixel size they were built at, so none can reach
production unnoticed.

Keep the file names when you swap in real art. The components reference these
exact names, so a rename is also a code change.

Unzip so the paths become `public/images/<folder>/<file>`, except `social` and
`press`, noted below.

---

## hero  (3 files)

| File | Size | Note |
|---|---|---|
| `hero-sky.png` | 1920 x 1080 | Furthest parallax layer. Moves least. Can be a flat gradient with clouds. |
| `hero-skyline.png` | 1920 x 700 | Middle layer. **Needs transparency above the roofline** so the sky shows through. |
| `hero-birds.png` | 600 x 300 | Front layer, moves most. Transparent. Small, so it can repeat across the width. |

The skyline is currently drawn in code with a deterministic hash for the lit
windows. Real art replaces that whole generator, so once these land the hash
code comes out.

## logo  (2 files)

| File | Size | Note |
|---|---|---|
| `wordmark.png` | 1200 x 400 | BONGOMAN lockup, transparent. The site currently sets the title in Anton as live text. |
| `logo-mark.png` | 512 x 512 | Square icon. This is the source for the favicon, so it has to stay readable at 32px. Test it small before calling it done. |

## stories  (6 files)

| File | Size | Note |
|---|---|---|
| `story-01.jpg` to `story-06.jpg` | 1080 x 1920 | Comic panels, 9 by 16, JPG, **under 400KB each**. |

Six is a starting set, not a limit. Rings and items are defined in
`src/data/stories.js`, so add as many as you have.

The viewer uses `object-fit: contain`, so a page that is not 9 by 16 letterboxes
rather than crops. Nothing gets cut off, but a full comic page shrinks to
unreadable on a phone. **One cropped panel reads far better than a whole page.**

Item type `text` needs no file at all, so a coloured panel with a line of copy is
a free way to pace a ring between images.

## origin  (2 files)

| File | Size | Note |
|---|---|---|
| `kham-portrait.png` | 800 x 1000 | James "Kham" Kamawira. A real photograph is worth more here than an illustration. |
| `strip-1989.png` | 1400 x 900 | An original newspaper strip. This is the proof of the 1989 claim, so legibility matters more than resolution. |

The floating stick figures in this section are code drawn and stay that way.

## game-abilities  (7 files)

| File | Size | Note |
|---|---|---|
| `ability-run.png`, `-jump`, `-climb`, `-fight`, `-sneak`, `-swim`, `-explore` | 600 x 800 | Bongoman poses, transparent PNG. |

The one thing that matters across this set: **draw all seven at the same scale
with the character's feet on the same baseline.** The tabs swap these in place,
so if the figure sits at a different height or size in each file, he jumps around
as you click through. That reads as a bug rather than a pose change.

## protagonist-world-goal  (3 files)

| File | Size | Note |
|---|---|---|
| `card-protagonist.png`, `card-world.png`, `card-goal.png` | 500 x 600 | Card artwork. |

A colour panel wipes up from the bottom on hover, and on phones that panel is
permanently visible across the lower part of the card. **Keep faces and focal
detail in the top half** or the panel sits on them.

## world  (3 files)

| File | Size | Note |
|---|---|---|
| `world-stage-1.png` | 1600 x 900 | Nairobi Eastlands. |
| `world-stage-2.png` | 1600 x 900 | Peri urban, farmland. |
| `world-stage-3.png` | 1600 x 900 | Rural landscape. |

These crossfade in a sticky scroll, so the three want a **shared horizon line and
a consistent camera height**, otherwise the world appears to jump between stages
instead of opening out.

Framing constraint, already established: `background-size: cover` fills the stage
and `transform: scaleY(0.9)` anchored bottom pulls it back vertically only. Wide
screens crop from the top, narrow screens crop from the sides. **Keep focal
content horizontally centred and in the lower two thirds, nothing critical at the
very top or the far edges.**

## ebooks  (22 files)

| File | Size | Note |
|---|---|---|
| `ebook-01.png` to `ebook-11.png` | 600 x 900 | Cover art, 2 by 3. |
| `ebook-backdrop-01.png` to `-11.png` | 1600 x 800 | Per book illustration, 2 by 1. |

**The numbering is a guess.** The eleven real titles live in the ebooks data file
in the repo and I have not read it yet. Once I can, I will rename these to match
the actual slugs so the mapping is unambiguous. Do not spend time renaming them
by hand first.

Covers appear in a looping carousel at small size, so the title has to hold up
around 200px wide. Backdrops sit behind the expanded book, so they take a dark
overlay and should have no important detail dead centre.

## merchandise  (8 files)

| File | Size | Note |
|---|---|---|
| `merch-tee.png`, `-hoodie`, `-cap`, `-poster`, `-mug`, `-stickers`, `-tote`, `-keyring` | 300 x 350 | Product shots. |

The marquee crops nothing, so anything important sits inside the full frame.
Eight is enough to loop without an obvious repeat. Shoot or render them on a
**consistent background and at a consistent product scale**, because a marquee
puts them side by side where any mismatch is obvious.

## social  (1 file)

| File | Size | Note |
|---|---|---|
| `og-image.png` | 1200 x 630 | Goes in `public/`, not `public/images/`. |

This is the single highest visibility image on the site. It is what appears when
anyone shares the link in WhatsApp, and it is currently a generated placeholder
in the wrong typeface. Some platforms crop it to a square, so **keep the title
and character inside the middle 630 x 630**.

## press  (5 files)

Goes in `public/press/`, alongside the standalone press kit page.

| File | Size | Note |
|---|---|---|
| `press-key-art.png` | 1920 x 1080 | The image a journalist puts at the top of an article. |
| `press-screenshot-01.png` to `-03.png` | 1920 x 1080 | Real in game captures, not mockups. |
| `press-logo.png` | 1000 x 400 | Wordmark on transparent at high resolution. |

Standing note from the build plan: **gameplay footage is the highest value
missing asset on this whole project.** Screenshots are the still version of that,
and three real ones outrank every other item on this list for anyone deciding
whether to wishlist.

---

## Replacing a placeholder

Match the pixel size, keep the file name, drop it in the same folder.

For anything that needs to look crisp on a phone, export a second copy at twice
the size with an `@2x` suffix next to the original, for example
`merch-tee@2x.png`. The components can pick those up later without a rename pass.

Run `grep -rn "PLACEHOLDER" src` to see what is still standing in on the code
side. That covers store URLs, social handles and ebook buy links, which are text
rather than art.
