export default function InterestProfileCard({ interest }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Customer Interest Profile</h3>
      {!interest.hasData ? (
        <p className="text-sm text-muted-foreground">Not enough tracked browsing data yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Favourite Performer</p>
            <p className="text-sm font-medium text-foreground">{interest.favouritePerformer}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Favourite Studio</p>
            <p className="text-sm font-medium text-foreground">{interest.favouriteStudio}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Favourite Categories</p>
            <div className="flex flex-wrap gap-1">
              {interest.favouriteCategories.length ? interest.favouriteCategories.map(c => (
                <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">{c}</span>
              )) : <span className="text-sm text-muted-foreground">—</span>}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Favourite Tags</p>
            <div className="flex flex-wrap gap-1">
              {interest.favouriteTags.length ? interest.favouriteTags.map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">{t}</span>
              )) : <span className="text-sm text-muted-foreground">—</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}