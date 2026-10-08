import { Bell, CheckCircle2, CreditCard, MessageCircle, Radio, Sparkles } from "lucide-react";

const icons = {
  release: Sparkles,
  live: Radio,
  update: Bell,
  message: MessageCircle,
  payment: CreditCard,
  confirmed: CheckCircle2,
};

export default function DashboardNotificationCenter({ items = [] }) {
  if (!items.length) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-[#080b0e]/85 p-5 backdrop-blur-xl md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f0183d]">Notifications</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-white">What’s new for you</h2>
        </div>
        <div className="rounded-full border border-[#f0183d]/30 bg-[#f0183d]/10 px-3 py-1 text-[10px] font-black uppercase text-[#f0183d]">{items.length} new</div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.slice(0, 4).map((item, index) => {
          const Icon = icons[item.type] || Bell;
          return (
            <a key={`${item.title}-${index}`} href={item.href || "#"} className="group flex gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#f0183d]/40 hover:bg-white/[0.06]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f0183d]/12 text-[#f0183d]"><Icon className="h-5 w-5" /></div>
              <div className="min-w-0">
                <h3 className="line-clamp-1 text-sm font-black text-white group-hover:text-[#ff6b7a]">{item.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/45">{item.body}</p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}