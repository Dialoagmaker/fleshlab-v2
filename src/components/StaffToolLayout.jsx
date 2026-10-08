import { Link, Outlet } from "react-router-dom";
import { LogOut, Sparkles } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { base44 } from "@/api/base44Client";

export default function StaffToolLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-[#050505]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <Link to="/" aria-label="FLESHLAB home" className="flex items-center">
            <BrandLogo className="h-14 w-44" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/tools/ai-text-generator" className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white sm:inline-flex">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Text Generator
            </Link>
            <button onClick={() => base44.auth.logout("/")} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-white">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}