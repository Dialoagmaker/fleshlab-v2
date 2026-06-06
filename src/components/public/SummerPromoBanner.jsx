import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/i18n.jsx";

export default function SummerPromoBanner() {
  const { t } = useI18n();
  return (
    <section className="relative w-full overflow-hidden" style={{minHeight: 'clamp(400px, 80vw, 460px)'}}>
      {/* Background Image - Responsive, High-Resolution */}
      <div className="absolute inset-0">
        {/*
          TODO: Replace img src below with responsive R2 WebP sources once uploaded.
          Required R2 keys (export from original hero PNG at quality 85-90):
            studios/fleshlabasia/hero/hero-banner-mobile-900w.webp    (900×600)
            studios/fleshlabasia/hero/hero-banner-tablet-1600w.webp   (1600×800)
            studios/fleshlabasia/hero/hero-banner-desktop-2560w.webp  (2560×900)
            studios/fleshlabasia/hero/hero-banner-large-3840w.webp    (3840×900)
            studios/fleshlabasia/hero/hero-banner-ultra-5120w.webp    (5120×900)
          Once uploaded, replace <img> below with a <picture> block using those srcSet values.
          Do NOT uncomment or add <source> tags until the R2 files are confirmed live.
        */}
        <img
          src="https://video.fleshlab.online/studios/6a1ca4cdc29d96ab4c624c98/banner/ChatGPT%20Image%205.%20Juni%202026%2C%2012_46_38.png"
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: "50% 40%" }}
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
        {/* Cinematic dark overlay — tones down image brightness for premium feel */}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/40 via-transparent to-black/40" />
      </div>
      
      {/* Bottom fade for text readability */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
      {/* Top fade */}
      <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/30 to-transparent" />
      
      {/* Content Layer */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-0 sm:h-full sm:min-h-[340px]">
        <div className="max-w-5xl w-full text-center">

          {/* Top Badges — inline on mobile, absolutely positioned on sm+ */}
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-0 sm:absolute sm:top-4 sm:left-6 sm:right-6 flex-wrap">
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white text-[11px] sm:text-xs font-black px-3 py-1 rounded-full shadow-lg shadow-rose-600/60 uppercase tracking-wider whitespace-nowrap">
              {t('homepage.promoBadge1')}
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-[11px] sm:text-xs font-black px-3 py-1 rounded-full shadow-lg shadow-purple-600/60 uppercase tracking-wider whitespace-nowrap">
              {t('homepage.promoBadge2')}
            </div>
          </div>

          {/* Main Offer */}
          <div className="mb-1 sm:mb-3">
            <h1 className="font-black text-white drop-shadow-2xl leading-none tracking-tight" style={{fontSize: 'clamp(46px, 12vw, 120px)'}}>
              <span className="text-rose-500">{t('homepage.discount')}</span>
            </h1>
          </div>

          {/* Subheadline */}
          <div className="mb-2 sm:mb-4">
            <p className="font-bold text-white/90 drop-shadow-xl tracking-tight" style={{fontSize: 'clamp(18px, 4.5vw, 40px)'}}>
              {t('homepage.discountSub')}
            </p>
          </div>

          {/* Special Badge */}
          <div className="mb-3 sm:mb-6">
            <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-[11px] sm:text-sm font-bold px-3 sm:px-5 py-1 sm:py-2 rounded-full uppercase tracking-widest">
              {t('homepage.specialBadge')}
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-4 w-full sm:w-auto">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-sm sm:text-lg px-6 sm:px-8 py-[13px] sm:py-4 rounded-xl shadow-2xl shadow-rose-600/60 transition-all border-2 border-rose-500/50 leading-none"
            >
              {t('homepage.joinNow')}
            </Link>
            <Link
              to="/videos"
              className="w-full sm:w-auto bg-black/40 backdrop-blur-md hover:bg-black/60 text-white font-bold text-sm sm:text-lg px-6 sm:px-8 py-[13px] sm:py-4 rounded-xl border-2 border-rose-600/60 hover:border-rose-500 transition-all leading-none"
            >
              {t('homepage.browsePreviews')}
            </Link>
          </div>

          {/* Trust Row — compact on mobile */}
          <div className="flex items-center justify-center gap-3 text-[11px] text-white/60 font-medium flex-wrap">
            <span>{t('homepage.trustInstant')}</span>
            <span>·</span>
            <span>{t('homepage.trustSecure')}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{t('homepage.trustPremium')}</span>
          </div>

        </div>
      </div>
    </section>
  );
}