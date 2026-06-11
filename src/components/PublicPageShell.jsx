import TubeHeader from "@/components/tube/TubeHeader";
import TubeFooter from "@/components/tube/TubeFooter";
import { useEffect } from "react";

export default function PublicPageShell({ children, noIndex }) {
  // Suppress unhandled 401 errors on public pages
  useEffect(() => {
    const handleUnauthError = (event) => {
      const msg = String(event?.reason?.message || event?.reason || '');
      const url = String(event?.reason?.config?.url || event?.reason?.request?.responseURL || '');
      if (url.includes('User/me') || msg.includes('401') || msg.includes('Unauthorized')) {
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handleUnauthError);
    return () => window.removeEventListener('unhandledrejection', handleUnauthError);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      <TubeHeader />
      <main className="w-full">
        {children}
      </main>
      <TubeFooter />
    </div>
  );
}