export default function FanclubTab({ performer }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Fanclub</h2>
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Fanclub Enabled</p>
          <p className="text-sm text-foreground">{performer.fanclub_enabled ? "Yes" : "No"}</p>
        </div>
        {performer.onlyfans_url && (
          <div>
            <p className="text-xs text-muted-foreground">OnlyFans</p>
            <p className="text-sm text-foreground">{performer.onlyfans_url}</p>
          </div>
        )}
        {performer.twitter_url && (
          <div>
            <p className="text-xs text-muted-foreground">Twitter</p>
            <p className="text-sm text-foreground">{performer.twitter_url}</p>
          </div>
        )}
        {performer.instagram_url && (
          <div>
            <p className="text-xs text-muted-foreground">Instagram</p>
            <p className="text-sm text-foreground">{performer.instagram_url}</p>
          </div>
        )}
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-500 font-medium">Fanclub Management Not Implemented</p>
          <p className="text-xs text-muted-foreground mt-1">
            Fanclub payment processing, subscriber management, and content gating are deferred to a later phase.
            No fanclub payment or management actions are available at this time.
          </p>
        </div>
      </div>
    </div>
  );
}