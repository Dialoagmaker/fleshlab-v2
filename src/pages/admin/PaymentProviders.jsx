import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import SEOMeta from "@/components/SEOMeta";
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, Clock, Globe, EyeOff, Key, Ban,
} from "lucide-react";

const RISK_COLORS = {
  active:            "text-emerald-400 bg-emerald-500/10",
  approval_required: "text-amber-400 bg-amber-500/10",
  future:            "text-white/35 bg-white/[0.04]",
  disabled:          "text-red-400 bg-red-500/10",
};

const PROVIDER_TYPE_ICONS = {
  crypto:                  Shield,
  card:                    Ban,
  paypal:                  Ban,
  adult_card_processor:    Shield,
  regional_card_processor: Globe,
};

export default function AdminPaymentProviders() {
  const [providers, setProviders] = useState([]);
  const [secrets, setSecrets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadProviders(); }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const res = await base44.functions.invoke("fleshPayProviderRegistry", {});
      setProviders(res.data.providers || []);
      setSecrets(res.data.providerSecrets || {});
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load provider data. Admin access required.");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="w-64 h-8" />
        <Skeleton className="w-full h-96 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-white/[0.06] bg-card/50 rounded-2xl">
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-foreground font-semibold">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOMeta title="Admin - Payment Providers" noIndex={true} />
      <div className="min-h-screen bg-background">
        <div className="max-w-[1600px] mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Payment Providers</h1>
              <p className="text-xs text-white/35 mt-0.5">FleshPay top-up provider registry — read-only</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {providers.map((p) => {
              const TypeIcon = PROVIDER_TYPE_ICONS[p.provider_type] || Shield;
              const pSecrets = secrets[p.key] || {};
              const enabledCount = Object.values(pSecrets).filter(Boolean).length;
              const totalCount = Object.keys(pSecrets).length;

              return (
                <Card key={p.key} className={`border rounded-2xl overflow-hidden transition-colors ${
                  p.enabled ? "border-emerald-500/15 bg-emerald-500/[0.02]" : "border-white/[0.06] bg-card/40"
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          p.enabled ? "bg-emerald-500/10" : "bg-white/[0.04]"
                        }`}>
                          <TypeIcon className={`w-5 h-5 ${p.enabled ? "text-emerald-400" : "text-white/25"}`} />
                        </div>
                        <div>
                          <CardTitle className="text-sm capitalize">{p.key}</CardTitle>
                          <p className="text-[11px] text-white/35 mt-0.5">{p.public_label}</p>
                        </div>
                      </div>
                      <Badge className={`text-[10px] rounded-lg ${RISK_COLORS[p.risk_status] || "text-white/40 bg-white/[0.04]"}`}>
                        {p.risk_status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {/* Enabled Status */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/35">Status</span>
                      <span className="flex items-center gap-1.5">
                        {p.enabled ? (
                          <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> <span className="text-emerald-400 font-medium">Enabled</span></>
                        ) : (
                          <><span className="w-1.5 h-1.5 rounded-full bg-white/20" /> <span className="text-white/40">Disabled</span></>
                        )}
                      </span>
                    </div>

                    {/* Public Visibility */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/35">Public UI</span>
                      <span className="flex items-center gap-1">
                        {p.public_enabled ? (
                          <><Globe className="w-3 h-3 text-emerald-400" /> <span className="text-emerald-400">Visible</span></>
                        ) : (
                          <><EyeOff className="w-3 h-3 text-white/25" /> <span className="text-white/40">Hidden</span></>
                        )}
                      </span>
                    </div>

                    {/* Capabilities */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/35">Wallet top-up</span>
                      {p.supports_wallet_topup ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-white/25" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/35">Direct checkout</span>
                      {p.supports_ppv_direct_checkout ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-white/25" />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/35">Provider type</span>
                      <span className="text-white/55 capitalize">{p.provider_type.replace(/_/g, ' ')}</span>
                    </div>

                    {/* Secrets Status */}
                    {totalCount > 0 && (
                      <div className="pt-2 mt-2 border-t border-white/[0.06]">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="flex items-center gap-1.5 text-white/35"><Key className="w-3 h-3" /> Secrets</span>
                          <span className={enabledCount === totalCount ? "text-emerald-400" : "text-amber-400"}>
                            {enabledCount}/{totalCount} set
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {Object.entries(pSecrets).map(([name, isSet]) => (
                            <div key={name} className="flex items-center justify-between text-[11px]">
                              <span className="text-white/30 font-mono">{name}</span>
                              {isSet ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <XCircle className="w-3 h-3 text-white/15" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin Note */}
                    {p.admin_note && (
                      <div className="pt-2 mt-2 border-t border-white/[0.06]">
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                          <p className="text-[11px] text-amber-400/80 leading-relaxed">{p.admin_note}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}