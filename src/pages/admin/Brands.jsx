import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Edit, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Brands() {
  const [search, setSearch] = useState("");

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: () => base44.entities.Brand.list("name", 200),
  });

  const filtered = brands.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brands</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {brands.length} total{brands.length >= 200 && <span className="ml-2 text-xs text-yellow-400">(showing first 200 records)</span>}
          </p>
        </div>
        <Link to="/admin/brands/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> New Brand
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search brands…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          {search ? "No brands match your search." : "No brands yet."}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-muted-foreground font-medium px-4 py-3">Brand</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3 hidden sm:table-cell">Slug</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3">Status</th>
                <th className="text-right text-muted-foreground font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {b.logo_url && (
                        <div className="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                          <img src={b.logo_url} alt={b.name} className="w-full h-full object-contain p-1" />
                        </div>
                      )}
                      <div className="font-medium text-foreground">{b.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <code className="text-xs text-muted-foreground">{b.slug}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      b.status === "active"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>
                      {b.status || "active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/brands/${b.id}`} className="p-1.5 text-muted-foreground hover:text-primary transition-colors inline-block">
                      <Edit className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}