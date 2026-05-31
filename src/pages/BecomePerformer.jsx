import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Play, Users, Film, Heart, TrendingUp, Shield, Check, Upload, Camera, MessageCircle, Calendar, Zap, Star, Globe, DollarSign, Briefcase, Scale, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

// Talent categories with cinematic imagery
const talentCategories = [
  {
    title: "THE AMATEUR",
    desc: "Already creating content. Knows your audience. Ready to scale.",
    image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png"
  },
  {
    title: "THE CALLBOY",
    desc: "Already earning through sex work. Want recurring revenue instead of one-off payments.",
    image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png"
  },
  {
    title: "THE WEBCAM MODEL",
    desc: "Already streaming. Ready for professional production and brand building.",
    image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png"
  },
  {
    title: "THE NEWCOMER",
    desc: "No experience. Strong potential. Comfortable with adult entertainment.",
    image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png"
  },
];

// What you'll actually do - direct and honest
const realityItems = [
  { icon: Film, label: "Solo Productions", desc: "Self-created content for your fanclub" },
  { icon: Camera, label: "Amateur Productions", desc: "Home-made and self-produced scenes" },
  { icon: Users, label: "Studio Partner Productions", desc: "Professional shoots with approved partners" },
  { icon: Heart, label: "Fanclub Content", desc: "Exclusive posts for paying subscribers" },
  { icon: Play, label: "Live Cam Shows", desc: "Streaming through approved partner platforms" },
  { icon: DollarSign, label: "Custom Content", desc: "Premium requests from dedicated fans" },
];

// What FLESHLAB builds - value proposition
const fleshlabBuilds = [
  { icon: Star, title: "Brand Development", desc: "Your name. Your identity. Your audience." },
  { icon: Globe, title: "Distribution Network", desc: "Multi-platform presence. Maximum reach." },
  { icon: Heart, title: "Fanclub Growth", desc: "Recurring revenue from dedicated fans." },
  { icon: Users, title: "Audience Building", desc: "Strategic marketing and promotion." },
  { icon: TrendingUp, title: "Revenue Expansion", desc: "Multiple income streams. Long-term growth." },
  { icon: Film, title: "Production Planning", desc: "Content strategy. Release schedules." },
  { icon: Briefcase, title: "Business Management", desc: "Contracts. Payments. Administrative support." },
  { icon: Scale, title: "Legal Infrastructure", desc: "Compliance. Rights. Protection." },
];

// Application process steps
const processSteps = [
  { num: 1, title: "Application", desc: "Submit your profile", icon: Upload },
  { num: 2, title: "Review", desc: "We evaluate your potential", icon: Star },
  { num: 3, title: "Interview", desc: "15-min call to connect", icon: MessageCircle },
  { num: 4, title: "Verification", desc: "ID and age confirmation", icon: Shield },
  { num: 5, title: "Contract", desc: "Exclusive representation", icon: Scale },
  { num: 6, title: "Launch", desc: "First production begins", icon: Zap },
];

export default function BecomePerformer() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    stage_name: "",
    legal_name: "",
    age_confirmed: false,
    country: "",
    city: "",
    email: "",
    phone: "",
    telegram: "",
    whatsapp: "",
    interests: [],
    experience: "",
    social_links: "",
    consent_confirmed: false,
    privacy_accepted: false,
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        applicant_name: data.stage_name,
        email: data.email,
        phone: data.phone || data.telegram || data.whatsapp,
        nationality: data.country,
        message: `Interests: ${data.interests.join(", ")}\nExperience: ${data.experience}\nSocial: ${data.social_links}\nLegal Name: ${data.legal_name}\nCity: ${data.city}`,
        package_interest: data.interests[0] || "not_sure",
        status: "pending",
        submitted_at: new Date().toISOString(),
      };
      const response = await base44.functions.invoke("submitPerformerApplication", payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Application submitted! We'll contact you within 48 hours.");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit application");
    },
  });

  const canSubmit = () => {
    return formData.stage_name && formData.legal_name && formData.age_confirmed &&
           formData.country && formData.email && formData.consent_confirmed && formData.privacy_accepted;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ACT 1: HERO - Cinematic Opening */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background z-0" />
        
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-7xl md:text-9xl font-black text-foreground mb-8 leading-none tracking-tight">
              SEX SELLS.<br />
              <span className="text-primary">A BRAND LASTS.</span>
            </h1>
            <p className="text-2xl md:text-3xl text-muted-foreground mb-4 max-w-4xl mx-auto font-light">
              Most guys sell their time.
            </p>
            <p className="text-2xl md:text-3xl text-muted-foreground mb-12 max-w-4xl mx-auto font-light">
              FLESHLAB builds performers.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              <span className="text-lg text-muted-foreground">Content.</span>
              <span className="text-primary">•</span>
              <span className="text-lg text-muted-foreground">Fans.</span>
              <span className="text-primary">•</span>
              <span className="text-lg text-muted-foreground">Revenue.</span>
              <span className="text-primary">•</span>
              <span className="text-lg text-muted-foreground">Distribution.</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-12 py-8 text-xl shadow-2xl shadow-primary/40"
                onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                JOIN FLESHLAB TALENT
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border hover:bg-muted px-12 py-8 text-xl"
                onClick={() => document.getElementById('who-we-want')?.scrollIntoView({ behavior: 'smooth' })}
              >
                HOW IT WORKS
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ACT 2: WHO WE'RE LOOKING FOR - Talent Categories */}
      <section id="who-we-want" className="py-32 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl md:text-8xl font-black text-foreground mb-6">
              WHO WE'RE<br />
              <span className="text-primary">LOOKING FOR.</span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {talentCategories.map((category, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="group relative overflow-hidden"
              >
                <div className="aspect-[3/4] relative">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">{category.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{category.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ACT 3: THE REALITY - What You'll Actually Do */}
      <section className="py-32 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl md:text-8xl font-black text-foreground mb-6">
              WHAT WILL YOU<br />
              <span className="text-primary">ACTUALLY DO?</span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {realityItems.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="p-8 rounded-none bg-background border-l-2 border-primary"
              >
                <item.icon className="w-10 h-10 text-primary mb-6" />
                <h3 className="text-xl font-bold text-foreground mb-3">{item.label}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ACT 4: WHAT FLESHLAB BUILDS - Value Proposition */}
      <section className="py-32 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl md:text-8xl font-black text-foreground mb-6">
              WHAT FLESHLAB<br />
              <span className="text-primary">BUILDS.</span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {fleshlabBuilds.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="p-8 rounded-none bg-gradient-to-br from-primary/10 to-background border border-primary/30"
              >
                <item.icon className="w-12 h-12 text-primary mb-6" />
                <h3 className="text-lg font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ACT 5: EXCLUSIVE REPRESENTATION */}
      <section className="py-32 px-6 bg-card/30">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Star className="w-20 h-20 text-primary mx-auto mb-8" />
            <h2 className="text-6xl md:text-8xl font-black text-foreground mb-8">
              EXCLUSIVE<br />
              <span className="text-primary">REPRESENTATION.</span>
            </h2>
            <div className="space-y-6 max-w-3xl mx-auto text-left">
              <p className="text-xl text-muted-foreground leading-relaxed">
                FLESHLAB operates under an <span className="text-foreground font-bold">exclusive management structure</span>.
              </p>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Approved performers are <span className="text-foreground font-bold">represented by FLESHLAB</span>.
              </p>
              <p className="text-xl text-muted-foreground leading-relaxed">
                We invest in performers because we <span className="text-foreground font-bold">actively manage their growth</span>.
              </p>
              <Alert className="mt-8 bg-primary/10 border-primary/30">
                <AlertDescription className="text-foreground">
                  This is not an open creator marketplace. This is a <span className="font-bold">managed talent system</span>.
                </AlertDescription>
              </Alert>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ACT 6: WHAT YOU NEED - Requirements */}
      <section className="py-32 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl md:text-8xl font-black text-foreground mb-6">
              WHAT YOU NEED.
            </h2>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-12 rounded-none bg-card border border-border"
          >
            <ul className="space-y-6 mb-8">
              {[
                "18+ years old",
                "Passport OR National ID OR Driver's License",
                "Smartphone capable of recording video",
                "Laptop or PC for webcam activities",
                "Reliable communication",
                "Comfortable working in adult entertainment"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-4">
                  <Check className="w-6 h-6 text-primary shrink-0" />
                  <span className="text-lg text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ACT 7: APPLICATION PROCESS */}
      <section className="py-32 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl md:text-8xl font-black text-foreground mb-6">
              APPLICATION PROCESS.
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {processSteps.map((step) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: step.num * 0.05 }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-none bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-10 h-10" />
                </div>
                <p className="font-black text-foreground text-lg mb-2">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL ACT: CLOSING CTA */}
      <section className="py-40 px-6 bg-gradient-to-b from-background to-card/30">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-7xl md:text-9xl font-black text-foreground mb-8 leading-none tracking-tight">
              THINK YOU HAVE<br />
              <span className="text-primary">WHAT IT TAKES?</span>
            </h2>
            <p className="text-2xl md:text-3xl text-muted-foreground mb-12 max-w-3xl mx-auto font-light">
              Your next client pays once.<br />
              A fanbase pays for years.
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-16 py-10 text-3xl shadow-2xl shadow-primary/40"
              onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              APPLY FOR FLESHLAB TALENT
            </Button>
          </motion.div>
        </div>
      </section>

      {/* APPLICATION FORM - At The Bottom */}
      <section id="application-form" className="py-32 px-6 bg-background">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              CREATE YOUR PROFILE
            </h2>
            <p className="text-muted-foreground">Private. Secure. Confidential.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card border border-border p-10"
          >
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stage_name">Stage Name (Public)</Label>
                  <Input
                    id="stage_name"
                    value={formData.stage_name}
                    onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
                    placeholder="Your performer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legal_name">Legal Name (Private)</Label>
                  <Input
                    id="legal_name"
                    value={formData.legal_name}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    placeholder="For contract purposes"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.age_confirmed}
                    onCheckedChange={(checked) => setFormData({ ...formData, age_confirmed: checked })}
                  />
                  I confirm I am 18+ years old
                </Label>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Where you're based"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Your city"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone or Messaging App</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone, Telegram, or WhatsApp"
                />
              </div>

              <div className="space-y-2">
                <Label>What interests you? (Select all that apply)</Label>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { value: "studio_scenes", label: "Studio productions" },
                    { value: "live_cam", label: "Live cam shows" },
                    { value: "fanclub", label: "Fanclub content" },
                    { value: "all", label: "All of the above" },
                    { value: "not_sure", label: "Not sure yet" },
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      className={`p-4 border cursor-pointer transition-colors ${
                        formData.interests.includes(opt.value)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => {
                        if (formData.interests.includes(opt.value)) {
                          setFormData({ ...formData, interests: formData.interests.filter(i => i !== opt.value) });
                        } else {
                          setFormData({ ...formData, interests: [...formData.interests, opt.value] });
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox checked={formData.interests.includes(opt.value)} readOnly />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Any Experience?</Label>
                <Textarea
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="Beginners welcome. Pros preferred. Just be honest."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="social">Social Links (Optional)</Label>
                <Textarea
                  id="social"
                  value={formData.social_links}
                  onChange={(e) => setFormData({ ...formData, social_links: e.target.value })}
                  placeholder="Twitter, Instagram, OnlyFans, etc. Or leave blank."
                  className="min-h-[60px]"
                />
              </div>

              <div className="space-y-4 pt-6 border-t border-border">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="consent"
                    checked={formData.consent_confirmed}
                    onCheckedChange={(checked) => setFormData({ ...formData, consent_confirmed: checked })}
                  />
                  <Label htmlFor="consent" className="font-normal text-sm">
                    I confirm this information is accurate and consent to FLESHLAB contacting me.
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="privacy"
                    checked={formData.privacy_accepted}
                    onCheckedChange={(checked) => setFormData({ ...formData, privacy_accepted: checked })}
                  />
                  <Label htmlFor="privacy" className="font-normal text-sm">
                    I accept the Privacy Policy.
                  </Label>
                </div>
              </div>

              {submitMutation.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitMutation.error.message}</AlertDescription>
                </Alert>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={!canSubmit() || submitMutation.isPending}
                onClick={() => submitMutation.mutate(formData)}
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}