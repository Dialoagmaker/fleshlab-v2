export default function MarketingAttributionCard({ attribution }) {
  const rows = [
    { label: "Channel", value: attribution.channel },
    { label: "Referrer", value: attribution.referrer },
    { label: "Landing Page", value: attribution.landingPage },
    { label: "UTM Source", value: attribution.utmSource },
    { label: "UTM Medium", value: attribution.utmMedium },
    { label: "UTM Campaign", value: attribution.utmCampaign },
  ];
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Marketing Attribution</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {rows.map(r => (
          <div key={r.label}>
            <p className="text-xs text-muted-foreground mb-0.5">{r.label}</p>
            <p className="text-sm font-medium text-foreground truncate">{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}