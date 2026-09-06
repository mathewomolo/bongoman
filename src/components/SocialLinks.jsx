import "./SocialLinks.css";

// PLACEHOLDER: swap each `href` for the real account URL. WhatsApp group
// invites look like https://chat.whatsapp.com/XXXXXXXX (get it from the
// group: Group info -> Invite via link).
//
// On the missing logos: YouTube, TikTok, Instagram and WhatsApp all
// publish official brand assets with usage rules, and drawing lookalike
// versions is both a trademark problem and usually visibly off. The
// standard route is `npm i react-icons` (ships the real marks, properly
// licensed) or each platform's own press kit. Set-in-type labels are a
// deliberate choice here rather than a gap: they suit the comic
// lettering the rest of the site is built on, and they stay legible at
// the sticker-scan sizes this site gets viewed at.
const CHANNELS = [
  { id: "whatsapp", name: "WhatsApp", blurb: "The group chat", href: null, primary: true },
  { id: "youtube", name: "YouTube", blurb: "Devlogs", href: null },
  { id: "tiktok", name: "TikTok", blurb: "Clips", href: null },
  { id: "instagram", name: "Instagram", blurb: "Art drops", href: null },
];

export default function SocialLinks() {
  return (
    <ul className="socials">
      {CHANNELS.map((channel) => {
        const className = `social${channel.primary ? " social--primary" : ""}`;
        const inner = (
          <>
            <span className="social__name">{channel.name}</span>
            <span className="social__blurb">{channel.href ? channel.blurb : "Soon"}</span>
          </>
        );

        return (
          <li key={channel.id}>
            {channel.href ? (
              <a className={className} href={channel.href} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            ) : (
              <span className={`${className} social--soon`} aria-disabled="true">
                {inner}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
