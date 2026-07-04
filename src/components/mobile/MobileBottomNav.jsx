import { Link, useLocation } from "react-router-dom";
import { Home, Film, Users, Crown, UserCircle, LogIn } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getDashboardPath } from "@/lib/roleResolver";

export default function MobileBottomNav() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const isActive = (href) =>
    location.pathname === href || (href !== "/" && location.pathname.startsWith(href + "/"));

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/videos", label: "Videos", icon: Film },
    { href: "/performers", label: "Models", icon: Users },
    { href: "/fanclub", label: "Fanclub", icon: Crown },
    isAuthenticated
      ? { href: getDashboardPath(user), label: "Account", icon: UserCircle }
      : { href: "/login", label: "Log In", icon: LogIn },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={label}
              to={href}
              className="flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px]"
            >
              <Icon className={`w-5 h-5 ${active ? "text-rose-500" : "text-white/50"}`} />
              <span className={`text-[10px] font-semibold ${active ? "text-rose-500" : "text-white/50"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}