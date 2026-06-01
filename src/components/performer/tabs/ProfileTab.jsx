export default function ProfileTab({ performer }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Profile</h2>
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Display Name</p>
            <p className="text-sm text-foreground">{performer.display_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Slug</p>
            <p className="text-sm font-mono text-foreground">{performer.slug}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-sm text-foreground capitalize">{performer.status}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nationality</p>
            <p className="text-sm text-foreground">{performer.nationality || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date of Birth</p>
            <p className="text-sm text-foreground">{performer.date_of_birth || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Verified</p>
            <p className="text-sm text-foreground">{performer.verified ? "Yes" : "No"}</p>
          </div>
        </div>
        {performer.bio && (
          <div>
            <p className="text-xs text-muted-foreground">Bio</p>
            <p className="text-sm text-foreground">{performer.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
}