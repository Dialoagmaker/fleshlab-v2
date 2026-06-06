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
            <a href="/" className="inline-block mb-3">
              <div className="flex items-center gap-0.5">
                <span className="text-white font-extrabold text-lg md:text-xl tracking-tight">FLESH</span>
                <span className="bg-gradient-to-r from-rose-600 to-rose-700 text-white font-extrabold text-lg md:text-xl px-2.5 py-1 rounded-md shadow-lg shadow-rose-600/30">LAB</span>
              </div>
            </a>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs md:text-sm font-semibold text-white mb-3">{t('footer.explore')}</h4>
            <ul className="space-y-2">
              <li>
                <a href="/videos" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('nav.videos')}
                </a>
              </li>
              <li>
                <a href="/performers" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('nav.performers')}
                </a>
              </li>
              <li>
                <a href="/fanclub" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('nav.fanclub')}
                </a>
              </li>
              <li>
                <a href="/news" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('nav.news')}
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-xs md:text-sm font-semibold text-white mb-3">{t('footer.community')}</h4>
            <ul className="space-y-2">
              <li>
                <a href="/become-performer" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('nav.becomePerformer')}
                </a>
              </li>
              <li>
                <a href="/fan-productions" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  Fan Productions
                </a>
              </li>
              <li>
                <a href="/guest-production" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  Guest Production
                </a>
              </li>
              <li>
                <a href="/how-it-works" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('nav.howItWorks')}
                </a>
              </li>
              <li>
                <a href="/faq" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs md:text-sm font-semibold text-white mb-3">{t('footer.legal')}</h4>
            <ul className="space-y-2">
              <li>
                <a href="/terms" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('footer.terms')}
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('footer.privacy')}
                </a>
              </li>
              <li>
                <a href="/dmca" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('footer.dmca')}
                </a>
              </li>
              <li>
                <a href="/2257" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  {t('footer.compliance2257')}
                </a>
              </li>
              <li>
                <a href="/imprint" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  Imprint / Legal Notice
                </a>
              </li>
              <li>
                <a href="/cookie-policy" className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Compliance */}
        <div className="border-t border-white/8 pt-8">
          <div className="text-center">
            <p className="text-xs text-white/50 leading-relaxed mb-4">
              <strong className="text-white/70">18 U.S.C. 2257 Record-Keeping Requirements Compliance Statement:</strong> All models, performers, and actors appearing on this website were 18 years of age or older at the time of the creation of the depictions. The owner and operator of this website is not the primary producer. Records required to be maintained by 18 U.S.C. § 2257 and its associated regulations are kept by the original producer of the content.
            </p>
            <div className="flex justify-center gap-4 text-xs text-white/60 mb-2">
              <a href="/dmca" className="hover:text-rose-500">DMCA</a>
              <span>|</span>
              <a href="/2257" className="hover:text-rose-500">2257 Compliance</a>
              <span>|</span>
              <a href="mailto:support@fleshlab.online" className="hover:text-rose-500">Content Removal</a>
              <span>|</span>
              <a href="mailto:support@fleshlab.online" className="hover:text-rose-500">Support</a>
            </div>
            <p className="text-xs text-white/40">
              {t('footer.copyright').replace('{year}', currentYear)}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}