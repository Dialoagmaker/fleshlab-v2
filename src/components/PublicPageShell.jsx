import TubeHeader from "@/components/tube/TubeHeader";
import TubeFooter from "@/components/tube/TubeFooter";
export default function PublicPageShell({ children }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      {/* Unified Tube Header with Navigation */}
      <TubeHeader />
      
      {/* Main Content */}
      <main>
        {children}
      </main>
      
      {/* Footer */}
      <TubeFooter />
    </div>
  );
}