import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { LIVE_LINKS } from "@/lib/liveLinks";

const REDIRECT_MAP = {
  "live":             LIVE_LINKS.live,
  "fitmaster":        LIVE_LINKS.fitmaster,
  "performer-signup": LIVE_LINKS.performerSignup,
};

export default function GoRedirect() {
  const { slug } = useParams();
  const url = REDIRECT_MAP[slug];

  useEffect(() => {
    if (url) {
      window.location.replace(url);
    }
  }, [url]);

  if (!url) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50 text-sm">Redirect not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-white/50 text-sm">Redirecting…</p>
    </div>
  );
}