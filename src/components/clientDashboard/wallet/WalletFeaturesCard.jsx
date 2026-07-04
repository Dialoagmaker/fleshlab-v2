const FEATURES = [
  { img: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/40f80a326_feature_instant_topup.png", alt: "Instant Top-up" },
  { img: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/6008744fc_feature_ready_to_use.png", alt: "Ready to Use" },
  { img: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/07aa60f1f_feature_secure_safe.png", alt: "Secure & Safe" },
];

export default function WalletFeaturesCard() {
  return (
    <div className="rounded-3xl bg-[#0d0d0d] border border-white/[0.08] p-6 flex items-center justify-around gap-4">
      {FEATURES.map((f) => (
        <img key={f.alt} src={f.img} alt={f.alt} className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
      ))}
    </div>
  );
}