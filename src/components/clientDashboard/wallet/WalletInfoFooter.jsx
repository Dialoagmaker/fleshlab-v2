const INFO = [
  { icon: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/21cc2fca6_icon_dollar.png", label: "Currency", value: "USD" },
  { icon: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/b8728ab4e_icon_lightning.png", label: "Processing Time", value: "Instant" },
  { icon: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/6efbc6209_icon_document.png", label: "Accepted Payments", value: "Stripe, PayPal" },
  { icon: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/0018320f3_icon_support.png", label: "Support", value: "24/7 Available" },
];

export default function WalletInfoFooter() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {INFO.map(({ icon, label, value }) => (
        <div key={label} className="rounded-2xl bg-[#0d0d0d] border border-white/[0.08] p-4 flex items-center gap-3">
          <img src={icon} alt="" className="w-9 h-9 object-contain shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-semibold">{label}</p>
            <p className="text-xs font-bold text-white truncate">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}