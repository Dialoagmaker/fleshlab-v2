import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import StudioHeader from "./StudioHeader";
import StudioNav from "./StudioNav";
import StudioFooter from "./StudioFooter";

/**
 * StudioLayout - Public-facing layout shell
 * Used for: /, /videos, /news, /performers, /become-performer
 * NOT used for: /admin/*, /performer/*, /account
 */
export default function StudioLayout() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <StudioHeader scrolled={scrolled} />
      <StudioNav />
      <main className="pt-16">
        <Outlet />
      </main>
      <StudioFooter />
    </div>
  );
}