import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";
import { trackRecruitmentFunnelStage } from "@/lib/recruitmentOptimization";
import { AlertCircle, ArrowRight, Loader2, Lock, ShieldCheck } from "lucide-react";
import IntakeOptionButton from "@/components/becomePerformer/IntakeOptionButton";
import CreatorPathResult from "@/components/becomePerformer/CreatorPathResult";
import RecruitmentTrustCard from "@/components/becomePerformer/RecruitmentTrustCard";

const PATHS = [
  ["beginner", "I am curious but new", "Start with phone-shot content and guided support."],
  ["existing", "I already create", "Grow an existing catalog, fanbase, or creator presence."],
  ["cam", "I perform live", "Turn live attention into fanclub and content momentum."],
  ["studio", "I want studio support", "Explore planned scenes, production help, and publishing."],
  ["couple", "We create as a couple", "Build with dual consent, privacy, and shared planning."],
  ["unsure", "I am not sure yet", "Let FLESHLAB recommend the strongest next step."],
];

const INTERESTS = ["Homemade", "Studio Productions", "Fanclub", "Live Shows", "Partner Scenes", "Not sure yet"];

export default function PrivateCreatorIntake({ onVerifyClick }) {
  const [form, setForm] = useState({ name: "", email: "", contact: "", country: "", path: "", interests: [], experience: "", age: false });
  const [started, setStarted] = useState(false);
  const [startedAt] = useState(Date.now());
  const markStarted = () => {
    if (!started) {
      setStarted(true);
      trackRecruitmentFunnelStage('private_intake_started');
    }
  };
  const selectedPath = useMemo(() => form.path || "unsure", [form.path]);
  const toggleInterest = (value) => setForm((f) => ({ ...f, interests: f.interests.includes(value) ? f.interests.filter((item) => item !== value) : [...f.interests, value] }));

  const submit = useMutation({
    mutationFn: async () => {
      const payload = {
        applicant_name: form.name,
        email: form.email,
        phone: form.contact,
        nationality: form.country,
        interests: form.interests,
        package_interest: form.path || "not_sure",
        experience: form.experience || null,
        source_page: "become_performer_private_intake",
        message: [`Creator path: ${form.path || "unsure"}`, `Interests: ${form.interests.join(", ") || "Not specified"}`, form.experience ? `Notes: ${form.experience}` : ""].filter(Boolean).join("\n"),
      };
      const response = await base44.functions.invoke("submitPerformerApplication", payload);
      return response.data;
    },
    onMutate: () => {
      const payload = { creator_path: selectedPath, interests_count: form.interests.length, seconds_to_submit: Math.round((Date.now() - startedAt) / 1000) };
      trackRecruitmentFunnelStage('private_intake_completed', payload);
    },
    onError: () => trackEvent("recruitment_private_intake_error", { creator_path: selectedPath }),
  });

  const valid = form.name && form.email && form.country && form.age;

  return (
    <div id="private-creator-intake" className="rounded-[2rem] border border-primary/25 bg-card p-6 shadow-2xl shadow-primary/10 md:p-8">
      <div className="mb-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
        <div><p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-primary">Private Creator Intake</p><h3 className="text-3xl font-black leading-tight text-foreground md:text-4xl">Start privately. Find your creator path first.</h3></div>
        <p className="text-sm leading-7 text-muted-foreground">This is the low-pressure first step before full verification. FLESHLAB uses it to understand your fit and recommend the right creator journey.</p>
      </div>

      {submit.isSuccess ? <CreatorPathResult path={selectedPath} onVerifyClick={onVerifyClick} /> : <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><div><Label className="text-xs uppercase tracking-widest text-muted-foreground">Name / stage name *</Label><Input value={form.name} onFocus={markStarted} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 bg-background" /></div><div><Label className="text-xs uppercase tracking-widest text-muted-foreground">Country *</Label><Input value={form.country} onFocus={markStarted} onChange={(e) => setForm({ ...form, country: e.target.value })} className="mt-1 bg-background" /></div></div>
          <div><Label className="text-xs uppercase tracking-widest text-muted-foreground">Email *</Label><Input type="email" value={form.email} onFocus={markStarted} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 bg-background" /></div>
          <div><Label className="text-xs uppercase tracking-widest text-muted-foreground">WhatsApp / Telegram</Label><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="mt-1 bg-background" /></div>
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4"><label className="flex items-start gap-3"><Checkbox checked={form.age} onCheckedChange={(age) => setForm({ ...form, age: !!age })} /><span className="text-sm leading-6 text-muted-foreground">I confirm I am 18 years or older and understand FLESHLAB is adult creator work, not escorting, dating or private pressure. *</span></label></div>
          <div className="grid gap-3 sm:grid-cols-2"><RecruitmentTrustCard type="privacy" compact /><RecruitmentTrustCard type="control" compact /></div>
        </div>

        <div className="space-y-5">
          <div><Label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">Which sounds most like you?</Label>{!form.path && <p className="mb-3 rounded-xl border border-border bg-secondary/30 px-4 py-3 text-xs leading-5 text-muted-foreground">Choose the closest path so we can prepare a roadmap that fits your experience level. You can choose “not sure yet” if you want FLESHLAB to guide you.</p>}<div className="grid gap-2 sm:grid-cols-2">{PATHS.map(([value, label, description]) => <IntakeOptionButton key={value} label={label} description={description} selected={form.path === value} onClick={() => { markStarted(); setForm({ ...form, path: value }); trackRecruitmentFunnelStage('creator_path_selected', { creator_path: value, changed_from: form.path || null }); }} />)}</div></div>
          <div><Label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">What are you interested in?</Label><div className="flex flex-wrap gap-2">{INTERESTS.map((item) => <button key={item} type="button" onClick={() => toggleInterest(item)} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${form.interests.includes(item) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/35 text-muted-foreground hover:text-foreground"}`}>{item}</button>)}</div></div>
          <Textarea value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="Optional: tell us about your experience, goals, privacy concerns, or what kind of creator you want to become." className="min-h-[112px] bg-background" />
        </div>
      </div>}

      {submit.isError && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive-foreground"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /><p>We couldn’t create your private roadmap just now. Please check your connection and try again — the details you entered are still here.</p></div>}
      {!submit.isSuccess && <div className="mt-7 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-primary" />Private review</span><span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" />Verification comes next</span></div><Button disabled={!valid || submit.isPending} onClick={() => submit.mutate()} className="h-auto min-h-12 rounded-xl bg-primary px-7 py-3 font-black uppercase tracking-wide text-primary-foreground hover:bg-primary/90">{submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{submit.isPending ? "Preparing your private roadmap..." : "Unlock my creator roadmap"} <ArrowRight className="ml-2 h-4 w-4" /></Button></div>}
    </div>
  );
}