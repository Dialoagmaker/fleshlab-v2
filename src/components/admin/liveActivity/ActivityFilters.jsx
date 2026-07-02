const RANGE_OPTIONS = [
  { key: "15m", label: "Last 15 min" },
  { key: "1h", label: "Last hour" },
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "custom", label: "Custom range" },
];

export default function ActivityFilters({ filters, setFilters, eventOptions, browserOptions, deviceOptions, countryOptions, userOptions }) {
  const update = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => update("range", opt.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filters.range === opt.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filters.range === "custom" && (
        <div className="flex flex-wrap gap-2 items-center text-xs">
          <input type="date" value={filters.customFrom || ""} onChange={e => update("customFrom", e.target.value)}
            className="bg-background border border-border rounded-md px-2 py-1 text-foreground" />
          <span className="text-muted-foreground">to</span>
          <input type="date" value={filters.customTo || ""} onChange={e => update("customTo", e.target.value)}
            className="bg-background border border-border rounded-md px-2 py-1 text-foreground" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <select value={filters.eventName || ""} onChange={e => update("eventName", e.target.value)}
          className="bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground">
          <option value="">All Events</option>
          {eventOptions.map(ev => <option key={ev} value={ev}>{ev}</option>)}
        </select>

        <select value={filters.userId || ""} onChange={e => update("userId", e.target.value)}
          className="bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground">
          <option value="">All Users</option>
          {userOptions.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
        </select>

        <select value={filters.browser || ""} onChange={e => update("browser", e.target.value)}
          className="bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground">
          <option value="">All Browsers</option>
          {browserOptions.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select value={filters.device || ""} onChange={e => update("device", e.target.value)}
          className="bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground">
          <option value="">All Devices</option>
          {deviceOptions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select value={filters.country || ""} onChange={e => update("country", e.target.value)}
          className="bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground">
          <option value="">All Countries</option>
          {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}