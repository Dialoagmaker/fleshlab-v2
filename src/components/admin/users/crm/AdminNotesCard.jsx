import { useState } from "react";
import { Trash2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AdminNotesCard({ notes, onAdd, onDelete, isSaving }) {
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
        <StickyNote className="w-4 h-4 text-primary" /> Internal Admin Notes
      </h3>
      <p className="text-[11px] text-muted-foreground mb-3">Private — never visible to the customer.</p>

      <div className="flex gap-2 mb-4">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a private note…" className="text-sm min-h-[40px]" />
        <Button size="sm" onClick={handleAdd} disabled={isSaving || !text.trim()}>Add</Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
        {notes.map(n => (
          <div key={n.id} className="flex items-start justify-between gap-2 bg-muted/30 border border-border rounded-lg px-3 py-2">
            <div>
              <p className="text-sm text-foreground">{n.note}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {n.created_by_name || "Admin"} · {n.created_date ? new Date(n.created_date).toLocaleString() : ""}
              </p>
            </div>
            <button onClick={() => onDelete(n.id)} className="text-muted-foreground hover:text-destructive shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}