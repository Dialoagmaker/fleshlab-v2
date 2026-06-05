import { useState } from "react";
import TubeHeader from "@/components/tube/TubeHeader";
import TubeFooter from "@/components/tube/TubeFooter";
import HeaderBanner from "@/components/public/HeaderBanner";

export default function PublicPageShell({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Studio Banner */}
      <HeaderBanner />
      
      {/* Unified Tube Header with Navigation */}
      <TubeHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      
      {/* Main Content */}
      <main>
        {children}
      </main>
      
      {/* Footer */}
      <TubeFooter />
    </div>
  );
}