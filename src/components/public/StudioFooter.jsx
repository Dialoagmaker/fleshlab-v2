import { Link } from "react-router-dom";
import { Instagram, Twitter, Mail } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

/**
 * StudioFooter - Minimal footer for public pages
 */
export default function StudioFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0F0F0F] border-t border-white/[0.05] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-5">
              <BrandLogo className="h-[78px] w-[304px]" />
            </div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-rose-500">AMATEUR WINS.</p>
            <p className="text-sm text-[#F5F5F5]/60 max-w-md mb-4">
              An amateur studio built around real people, real chemistry and premium Asian creator productions.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/fleshlabasia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F5F5F5]/60 hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/fleshlabasia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F5F5F5]/60 hover:text-white transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="mailto:info@fleshlab.online"
                className="text-[#F5F5F5]/60 hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Explore</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/videos" className="text-sm text-[#F5F5F5]/60 hover:text-white transition-colors">
                  Videos
                </Link>
              </li>
              <li>
                <Link to="/performers" className="text-sm text-[#F5F5F5]/60 hover:text-white transition-colors">
                  Performers
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-sm text-[#F5F5F5]/60 hover:text-white transition-colors">
                  Studio Journal
                </Link>
              </li>
              <li>
                <Link to="/become-performer" className="text-sm text-[#F5F5F5]/60 hover:text-white transition-colors">
                  Become a Performer
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-sm text-[#F5F5F5]/60 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-[#F5F5F5]/60 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/2257" className="text-sm text-[#F5F5F5]/60 hover:text-white transition-colors">
                  18 U.S.C. 2257
                </Link>
              </li>
              <li>
                <Link to="/dmca" className="text-sm text-[#F5F5F5]/60 hover:text-white transition-colors">
                  DMCA
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Compliance */}
        <div className="mt-12 pt-8 border-t border-white/[0.05]">
          <div className="text-center space-y-4">
            <p className="text-xs text-[#F5F5F5]/40">
              All performers depicted on this website were 18 years of age or older at the time of photography.
              All content is protected by copyright and intellectual property laws.
            </p>
            <p className="text-xs text-[#F5F5F5]/40">
              © {currentYear} FLESHLAB Asia. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}