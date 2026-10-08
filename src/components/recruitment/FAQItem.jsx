export default function FAQItem({ q, a }) {
  return (
    <div className="bg-[#111] border border-white/8 rounded-xl p-6">
      <h3 className="text-white font-bold text-base mb-3">{q}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{a}</p>
    </div>
  );
}