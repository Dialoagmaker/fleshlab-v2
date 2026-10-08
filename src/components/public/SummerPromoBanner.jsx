import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/i18n.jsx";
import { Crown, Play, Shield } from "lucide-react";
import { trackFanclubCtaClick } from "@/lib/analytics";

export default function SummerPromoBanner() {
  const { t } = useI18n();

  const handleFanclubClick = () => {
    trackFanclubCtaClick('general', 'general', 'homepage_hero');
  };
  return (
    <section className="relative w-full overflow-hidden" style={{minHeight: 'clamp(480px, 65vh, 620px)'}}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://video.fleshlab.online/studios/6a1ca4cdc29d96ab4c624c98/banner/ChatGPT%20Image%205.%20Juni%202026%2C%2012_46_38.png"
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: "50% 40%" }}
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
        {/* Single cinematic overlay — left text area dark, right image visible */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.65) 28%, rgba(0,0,0,0.32) 55%, rgba(0,0,0,0.08) 100%)"
          }}
        />
        {/* Subtle top/bottom vignette only */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 40%, transparent 70%, rgba(0,0,0,0.35) 100%)"
          }}
        />
        {/* Subtle rose ambient glow */}
        <div className="absolute top-0 left-0 w-[600px] h-[400px] bg-rose-900/15 rounded-full blur-[120px]" />
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10 flex flex-col items-start justify-center px-6 sm:px-10 lg:px-16 min-h-full py-12">
        <div className="max-w-3xl">

          {/* Top Badges — Premium studio positioning */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <div className="bg-rose-600/20 border border-rose-600/40 text-rose-300 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
              {t('homepage.promoBadge1')}
            </div>
            <div className="bg-white/10 border border-white/20 text-white/70 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              {t('homepage.promoBadge2')}
            </div>
            <div className="bg-purple-600/20 border border-purple-600/40 text-purple-300 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider hidden sm:flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Fanclub Access
            </div>
          </div>

          {/* Main Headline — Premium studio messaging */}
          <div className="mb-4">
            <h1 className="font-black text-white drop-shadow-2xl leading-tight tracking-tight text-4xl sm:text-5xl lg:text-6xl xl:text-7xl">
              {t('homepage.headline')}
            </h1>
            <h2 className="font-black text-white/80 drop-shadow-xl tracking-tight text-3xl sm:text-4xl lg:text-5xl xl:text-6xl mt-2">
              {t('homepage.subheadline')}
            </h2>
          </div>

          {/* Subheadline — Value proposition */}
          <p className="text-white/70 text-base sm:text-lg lg:text-xl leading-relaxed mb-6 max-w-xl">
            Watch public previews for free. Unlock full scenes, early releases, bonus clips and member-only updates inside the FLESHLAB Fanclub.
          </p>

          {/* Small promo badge — Not aggressive */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {t('homepage.specialBadge')}
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-start gap-3 mb-2">
            <Link
              to="/fanclub"
              onClick={handleFanclubClick}
              className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 rounded-xl shadow-xl shadow-rose-600/40 transition-all border-0 leading-none"
            >
              {t('homepage.joinFanclub')}
            </Link>
            <Link
              to="/videos"
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white/80 font-medium text-sm px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl border border-white/10 hover:border-white/20 transition-all leading-none flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              {t('homepage.browsePreviews')}
            </Link>
          </div>

          {/* Price anchor */}
          <p className="text-white/50 text-xs sm:text-sm font-semibold mb-5">
            Fanclub from $20.99/month · Cancel anytime
          </p>

          {/* Trust Row */}
          <div className="flex items-center gap-4 text-xs text-white/50 font-medium flex-wrap">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-rose-500/60" />
              {t('homepage.trustSecure')}
            </span>
            <span>·</span>
            <span>{t('homepage.trustInstant')}</span>
            <span>·</span>
            <span>{t('homepage.trustPremium')}</span>
          </div>

        </div>
      </div>
    </section>
  );
}