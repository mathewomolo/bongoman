import "./Footer.css";

// PLACEHOLDER: where the credit points. Set it to Odwyre Artworld's site
// or portfolio and the line becomes a link. Leave it null and it renders
// as plain text rather than a dead anchor, which is worse than no link.
const CREDIT_HREF = null;
const CREDIT_TEXT = "Site by Odwyre Artworld";

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

      {/* Its own row, rather than a third item in the flex row above.
          Three items in a space-between row read as equal weight, and
          this one is deliberately the quietest thing on the page. */}
      <div className="container sitefooter__credit">
        {CREDIT_HREF ? (
          <a href={CREDIT_HREF} target="_blank" rel="noopener noreferrer">
            {CREDIT_TEXT}
          </a>
        ) : (
          <span>{CREDIT_TEXT}</span>
        )}
      </div>
    </footer>
  );
}