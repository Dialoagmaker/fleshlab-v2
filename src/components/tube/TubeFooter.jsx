import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/i18n.jsx";

export default function TubeFooter() {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#070707] border-t border-white/8">
      <div className="max-w-[1280px] mx-auto px-4 py-12">
        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-3">
              <div className="flex items-center gap-0.5">
                <span className="text-white font-extrabold text-lg md:text-xl tracking-tight">FLESH</span>
                <span className="bg-gradient-to-r from-rose-600 to-rose-700 text-white font-extrabold text-lg md:text-xl px-2.5 py-1 rounded-md shadow-lg shadow-rose-600/30">LAB</span>
              </div>
            </Link>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs md:text-sm font-semibold text-white mb-3">{t('footer.explore')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/videos" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('nav.videos')}
                </Link>
              </li>
              <li>
                <Link to="/performers" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('nav.performers')}
                </Link>
              </li>
              <li>
                <Link to="/fanclub" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('nav.fanclub')}
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('nav.news')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-xs md:text-sm font-semibold text-white mb-3">{t('footer.community')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/become-performer" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('nav.becomePerformer')}
                </Link>
              </li>
              <li>
                <Link to="/guest-production" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  Guest Production
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('nav.howItWorks')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs md:text-sm font-semibold text-white mb-3">{t('footer.legal')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/dmca" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('footer.dmca')}
                </Link>
              </li>
              <li>
                <Link to="/2257" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('footer.compliance2257')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Compliance */}
        <div className="border-t border-white/8 pt-8">
          <div className="text-center">
            <p className="text-xs text-white/50 leading-relaxed mb-2">
              <strong className="text-white/70">18 U.S.C. 2257 Compliance Notice:</strong> {t('footer.ageStatement')}
            </p>
            <p className="text-xs text-white/40">
              {t('footer.copyright').replace('{year}', currentYear)}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}