import { Lock, Mail, Key } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SecurityTab({ user }) {
  return (
    <div className="space-y-5">
      <h2 className="font-black text-white text-base flex items-center gap-2">
        <Lock className="w-4 h-4 text-rose-400" />
        Security
      </h2>

      <div className="bg-[#0f0f0f] border border-white/8 rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-white/25 shrink-0" />
            <div>
              <div className="text-white/70 text-sm font-semibold">Email address</div>
              <div className="text-white/35 text-xs mt-0.5">{user?.email || "—"}</div>
            </div>
          </div>
          <div className="text-xs text-emerald-400 font-bold bg-emerald-600/10 border border-emerald-600/20 px-2.5 py-1 rounded-full">Verified</div>
        </div>

        <div className="flex items-start justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <Key className="w-4 h-4 text-white/25 shrink-0" />
            <div>
              <div className="text-white/70 text-sm font-semibold">Password</div>
              <div className="text-white/35 text-xs mt-0.5">Use the forgot password flow to change your password.</div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.href = "/forgot-password"}
            className="border-white/12 text-white/55 hover:bg-white/8 hover:text-white text-xs h-8 px-3 shrink-0"
          >
            Change password
          </Button>
        </div>
      </div>

      <div className="bg-white/3 border border-white/6 rounded-xl p-4 text-white/25 text-xs leading-relaxed">
        Two-factor authentication and login session management will be available in a future update.
        For account security concerns, contact FLESHLAB Management.
      </div>
    </div>
  );
}