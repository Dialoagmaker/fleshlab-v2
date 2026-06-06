import TubeHeader from "@/components/tube/TubeHeader";
import TubeFooter from "@/components/tube/TubeFooter";

export default function PublicPageShell({ children }) {
  // Ensure immediate first paint - children always render (even if loading internally)
  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      {/* Header - visible on first paint */}
      <TubeHeader />
      
      {/* Main content area - always rendered, never blocked */}
      <main className="w-full">
        {children}
      </main>
      
      {/* Footer */}
      <TubeFooter />
    </div>
  );
}