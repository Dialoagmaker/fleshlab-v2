import { User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

function ProfileRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-3 border-b border-white/5 last:border-0">
      <span className="text-white/25 text-xs uppercase tracking-wider sm:w-36 shrink-0">{label}</span>
      <span className="text-white/70 text-sm">{value || "—"}</span>
    </div>
  );
}

export default function ProfileTab({ user, requests }) {
  const firstRequest = requests[0];
  const createdDate = user?.created_date
    ? new Date(user.created_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <div className="space-y-5">
      <h2 className="font-black text-white text-base flex items-center gap-2">
        <User className="w-4 h-4 text-rose-400" />
        Profile
      </h2>

      <div className="bg-[#0f0f0f] border border-white/8 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white/80 text-sm">Account Details</h3>
          <Button size="sm" disabled variant="outline" className="border-white/10 text-white/25 text-xs h-7 px-3 cursor-not-allowed">
            Edit Profile — Coming soon
          </Button>
        </div>

        <ProfileRow label="Display name" value={user?.full_name !== user?.email ? user?.full_name : null} />
        <ProfileRow label="Email" value={user?.email} />
        <ProfileRow label="Account type" value="Fan / Customer" />
        <ProfileRow label="Member since" value={createdDate} />

        {firstRequest?.phone && <ProfileRow label="WhatsApp / Contact" value={firstRequest.phone} />}
        {firstRequest?.nationality && <ProfileRow label="Country" value={firstRequest.nationality} />}
        {firstRequest?.city && <ProfileRow label="City" value={firstRequest.city} />}
      </div>

      <div className="bg-white/3 border border-white/6 rounded-xl p-4 text-white/25 text-xs leading-relaxed">
        Profile editing will be available in a future update. To update your contact details or city for a Fan Production request, contact FLESHLAB Management on WhatsApp.
      </div>
    </div>
  );
}