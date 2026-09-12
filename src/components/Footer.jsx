import "./Footer.css";

/* =========================================================
   The site footer.

   WHY IT IS ITS OWN COMPONENT
   ---------------------------
   It used to live inside Cta.jsx. That was fine while the CTA
   was the last section on the page, and it broke the moment
   the merchandise marquee was added after it: the footer
   turned up in the middle of the page with a whole section
   below it.

   Out here it renders last because App.jsx renders it last,
   which is the only thing that should decide where a footer
   sits.

   It is also OUTSIDE <main> now, which is what the element is
   for. A site footer is not part of the main content.
   ========================================================= */

export default function Footer() {
  // Read at render rather than hardcoded. A copyright line stuck on
  // last year is one of the fastest ways for a live site to look
  // abandoned, and this is the one date nobody remembers to update.
  const year = new Date().getFullYear();

  return (
    <footer className="sitefooter">
      <div className="container sitefooter__inner">
        <span>
          BONGOMAN, created by James &ldquo;Kham&rdquo; Kamawira. Developed by Mathew Omolo.
        </span>
        {/* &copy; rather than a literal copyright character, so this file
            stays pure ASCII. The literal one had already turned into
            mojibake once by being written UTF-8 and read back as
            Latin-1. An entity cannot do that. */}
        <span>&copy; {year} BONGOMAN. All rights reserved.</span>
      </div>
    </footer>
  );
}