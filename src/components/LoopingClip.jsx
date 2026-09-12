import { useReducedMotion } from "framer-motion";

/* =========================================================
   LoopingClip: a silent video that plays itself.

   WHY THIS EXISTS
   ---------------
   Two sections now show looping clips, the ability tabs and the
   origin story, and a self-playing video needs five things right
   or it fails in ways you only see on a device:

     autoPlay      obvious
     muted         without it every browser refuses to autoplay
     playsInline   without it iOS takes the video fullscreen
     loop          obvious
     the muted ref below

   That last one is the one that bites. React has a long habit of
   setting `muted` as an HTML attribute but not as the DOM
   property, and the autoplay policy reads the property. So a
   video with `muted` right there in the markup can still be
   refused, on a phone, while working perfectly in your editor.
   Setting it on the element itself is the reliable fix.

   Copy that markup into a second component and you get two
   chances to drop one of the five. Here there is one.

   REDUCED MOTION
   --------------
   Someone who asked their OS for less movement does not want a
   video looping at them unprompted. Autoplay and loop switch off
   and native controls appear instead, so the clip is still there
   for anyone who wants it.

   Note this is the opposite call from the story feed, where
   disabling auto-advance broke navigation outright. A decorative
   loop that waits to be asked costs nothing.

   PRELOAD
   -------
   `none` rather than `auto`, deliberately. Autoplay still works:
   the browser fetches when it decides to play, which for an
   off-screen video is when it scrolls into view. So a clip below
   the fold costs nothing until someone actually reaches it. With
   `auto` every clip on the page downloads immediately, which on
   the origin story means two files a visitor may never scroll to.

   NO TRANSPARENCY
   ---------------
   Worth remembering when the real clips get made. There is no
   transparent video format that works across browsers: VP9 with
   alpha fails on Safari, HEVC with alpha fails on Chrome.
   Whatever background is baked into the file is what shows.
   ========================================================= */

export default function LoopingClip({ src, width, height, className, ...rest }) {
  const reduceMotion = useReducedMotion();

  return (
    <video
      className={className}
      src={src}
      ref={(el) => {
        if (el) el.muted = true;
      }}
      autoPlay={!reduceMotion}
      loop={!reduceMotion}
      controls={Boolean(reduceMotion)}
      muted
      playsInline
      disablePictureInPicture
      preload="none"
      width={width}
      height={height}
      {...rest}
    />
  );
}