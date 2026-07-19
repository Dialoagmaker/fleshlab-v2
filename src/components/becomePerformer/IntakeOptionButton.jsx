export default function IntakeOptionButton({ label, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[74px] rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected ? "border-primary/70 bg-primary/12 text-white shadow-lg shadow-primary/10" : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/35 hover:text-foreground"}`}
    >
      <span className="block text-sm font-black text-foreground">{label}</span>
      {description && <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span>}
    </button>
  );
}