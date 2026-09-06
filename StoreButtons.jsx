import "./StoreButtons.css";

// PLACEHOLDER: both store pages are being set up. Set `href` to the real
// URL and the button turns itself into a live external link, no other
// edit needed. Leaving `href: null` is what renders the honest
// "coming soon" state below.
//
// Two conventions worth knowing when the real links land:
//   1. Google requires the official "Get it on Google Play" badge image
//      for Play Store links (developer.android.com/distribute/marketing-tools).
//      These typographic buttons are a stand-in until you drop that in.
//   2. A Steam wishlist is the single most valuable pre-launch action
//      there is: wishlist count is what Valve's algorithm uses to decide
//      how much launch-day visibility you get. That is why it earns a
//      button of its own rather than sitting in a list of links.
const STORES = [
  {
    id: "play",
    label: "Get it on Google Play",
    sub: "Android first",
    href: null,
    variant: "primary",
  },
  {
    id: "steam",
    label: "Wishlist on Steam",
    sub: "Helps us launch bigger",
    href: null,
    variant: "ghost",
  },
];

export default function StoreButtons({ size = "default" }) {
  return (
    <div className={`storebtns storebtns--${size}`}>
      {STORES.map((store) => {
        const className = `storebtn storebtn--${store.variant}`;

        // A dead `href="#"` link tells a mouse user nothing and lies to a
        // screen reader, which announces it as a working link. An honest
        // disabled button is the better pattern while the page does not
        // exist yet.
        if (!store.href) {
          return (
            <span key={store.id} className={`${className} storebtn--soon`} aria-disabled="true">
              <span className="storebtn__label">{store.label}</span>
              <span className="storebtn__sub">Coming soon</span>
            </span>
          );
        }

        return (
          <a
            key={store.id}
            className={className}
            href={store.href}
            // Standard for any external link opened in a new tab: without
            // `noopener` the destination page gets a handle on this one
            // via window.opener and can navigate it somewhere else.
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="storebtn__label">{store.label}</span>
            <span className="storebtn__sub">{store.sub}</span>
          </a>
        );
      })}
    </div>
  );
}