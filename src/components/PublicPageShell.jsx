// TODO: PublicPageShell uses normal anchors while manual public route dispatch is active. Restore React Router NavLink after router rebuild.
import { useState } from "react";

const navLinks = [
  { href: "/videos",           label: "Videos" },
  { href: "/performers",       label: "Performers" },
  { href: "/become-performer", label: "Become a Performer" },
  { href: "/fanclub",          label: "Fanclub" },
  { href: "/news",             label: "News" },
];

export default function PublicPageShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Helper to check if a link is active based on current pathname
  const isActive = (href) => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-background">
      <main>
        {children}
      </main>
    </div>
  );
}