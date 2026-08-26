import { ExternalLink } from "lucide-react";

const facebookUrl =
  process.env.NEXT_PUBLIC_FACEBOOK_URL ??
  "https://www.facebook.com/share/1Dy8cPVArD/";
const instagramUrl =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ??
  "https://www.instagram.com/seancutland?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";

export function SocialFollowLinks() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-stone-400">Follow Errant Arts</span>
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow Errant Arts on Facebook"
        className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-stone-100 transition-colors hover:bg-white/5"
      >
        Facebook
        <ExternalLink className="ml-2 h-4 w-4" />
      </a>
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow Errant Arts on Instagram"
        className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-stone-100 transition-colors hover:bg-white/5"
      >
        Instagram
        <ExternalLink className="ml-2 h-4 w-4" />
      </a>
    </div>
  );
}
