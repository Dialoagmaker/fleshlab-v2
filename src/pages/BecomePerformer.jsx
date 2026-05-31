import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, ArrowRight, Check, Upload, MessageCircle, Shield, Star, Film, Heart, Globe, TrendingUp, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

// Real performer data from FLESHLAB (Asian performers only)
const REAL_PERFORMERS = [
  { name: "Ze[D]", location: "Manila, PH", image: "https://base44.app/api/apps/69512bea20e7e5b8a6186fd5/files/public/69512bea20e7e5b8a6186fd5/d246f2643_WhatsAppBild2023-08-12.jpg" },
  { name: "Yero", location: "Cebu, PH", image: "https://base44.app/api/apps/69512bea20e7e5b8a6186fd5/files/public/69512bea20e7e5b8a6186fd5/0fb87950f_IMG-20230623-WA0019.jpg" },
  { name: "Josh", location: "Manila, PH", image: "https://base44.app/api/apps/69512bea20e7e5b8a6186fd5/files/public/69512bea20e7e5b8a6186fd5/3a6df758f_1694179373703.JPEG" },
  { name: "Julian", location: "Davao, PH", image: "https://base44.app/api/apps/69512bea20e7e5b8a6186fd5/files/public/69512bea20e7e5b8a6186fd5/18fe9d069_469121028_1221603939140534_8880509972313916004_n.jpg" },
  { name: "Kraken", location: "Manila, PH", image: "https://base44.app/api/apps/69512bea20e7e5b8a6186fd5/files/public/69512bea20e7e5b8a6186fd5/c9e2e88d8_photo_2023-12-12_21-37-05.jpg" },
  { name: "Benvao", location: "Iloilo, PH", image: "https://base44.app/api/apps/69512bea20e7e5b8a6186fd5/files/public/69512bea20e7e5b8a6186fd5/25cf4aedc_ben4.png" },
  { name: "Jameson", location: "Manila, PH", image: "https://base44.app/api/apps/69512bea20e7e5b8a6186fd5/files/public/69512bea20e7e5b8a6186fd5/d246f2643_WhatsAppBild2023-08-12.jpg" },
  { name: "The_Fitmaster", location: "Philippines", image: "https://base44.app/api/apps/69512bea20e7e5b8a6186fd5/files/public/69512bea20e7e5b8a6186fd5/3a6df758f_1694179373703.JPEG" },
];

// Real video data from FLESHLAB (only high quality with proper assets)
const REAL_VIDEOS = [
  { title: "Wild Asian Twink Jacking Off", thumbnail: "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/mj1.jpg" },
  { title: "Asian Twink Fucks His Own Ass", thumbnail: "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/DialogMaxX_BI-Alex---Wanking-in-the-School-Locker-Room.jpg" },
  { title: "Twink's Wild Orgasmic Solo Release", thumbnail: "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/DialogMaxX_Cute-Raven---hunky-Asian-twink-lying-touching-and-cumming.jpg" },
  { title: "Naked Asian Stud Jerks Off Post-Shower", thumbnail: "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/DialogMaxX_Cute-Raven---hunky-asian-touches-and-shoots-in-shower.jpg" },
];

// Behind the scenes lifestyle images
const BTS_IMAGES = [
  { label: "Content Creation", image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png" },
  { label: "Smartphone Filming", image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png" },
  { label: "Amateur Productions", image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png" },
  { label: "Live Cam Setup", image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png" },
  { label: "Studio Sessions", image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png" },
  { label: "Creator Workflow", image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png" },
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
        phone: data.phone,
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
      {/* ACT 1: HERO - Cinematic Production Environment */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background z-0" />
        
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-8xl md:text-[12rem] font-black text-foreground mb-8 leading-none tracking-tighter">
              FLESHLAB<br />
              <span className="text-primary">TALENT</span>
            </h1>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-12 py-8 text-xl shadow-2xl shadow-primary/40 mt-12"
              onClick={() => document.getElementById('roster')?.scrollIntoView({ behavior: 'smooth' })}
            >
              MEET THE PERFORMERS
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ACT 2: THE ROSTER - Real Performers */}
      <section id="roster" className="py-32 px-6 bg-background">
        <div className="max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl md:text-8xl font-black text-foreground mb-6">
              MEET THE<br />
              <span className="text-primary">MEN OF FLESHLAB</span>
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {REAL_PERFORMERS.map((performer, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group relative overflow-hidden aspect-[3/4]"
              >
                <img
                  src={performer.image}
                  alt={performer.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-xl font-black text-foreground mb-1">{performer.name}</h3>
                  <p className="text-xs text-muted-foreground">{performer.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ACT 3: LATEST PRODUCTIONS - Real Content */}
      <section className="py-32 px-6 bg-card/30">
        <div className="max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl md:text-8xl font-black text-foreground mb-6">
              LATEST<br />
              <span className="text-primary">PRODUCTIONS</span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REAL_VIDEOS.map((video, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group relative overflow-hidden aspect-video cursor-pointer"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center">
                    <Play className="w-10 h-10 text-primary-foreground fill-current" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-lg font-bold text-foreground line-clamp-2">{video.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ACT 4: LIFE INSIDE FLESHLAB - Behind The Scenes */}
      <section className="py-32 px-6 bg-background">
        <div className="max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl md:text-8xl font-black text-foreground mb-6">
              LIFE INSIDE<br />
              <span className="text-primary">FLESHLAB</span>
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {BTS_IMAGES.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group relative overflow-hidden aspect-square"
              >
                <img
                  src={item.image}
                  alt={item.label}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-sm font-bold text-foreground">{item.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ACT 5: WHY PEOPLE JOIN - Outcomes */}
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
              WHY PEOPLE<br />
              <span className="text-primary">JOIN</span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: TrendingUp, title: "Audience Growth", desc: "Build a dedicated fanbase" },
              { icon: Globe, title: "Distribution", desc: "Multi-platform reach" },
              { icon: Heart, title: "Fanclubs", desc: "Recurring revenue" },
              { icon: DollarSign, title: "Revenue Streams", desc: "Multiple income sources" },
              { icon: Film, title: "Professional Productions", desc: "High-quality content" },
              { icon: Star, title: "Brand Building", desc: "Long-term career growth" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="p-8 rounded-none bg-background border-l-2 border-primary"
              >
                <item.icon className="w-12 h-12 text-primary mb-6" />
                <h3 className="text-2xl font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ACT 6: EXCLUSIVE REPRESENTATION */}
      <section className="py-32 px-6 bg-background">
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
              <span className="text-primary">REPRESENTATION</span>
            </h2>
            <div className="space-y-6 max-w-3xl mx-auto text-left">
              <p className="text-2xl text-muted-foreground leading-relaxed">
                We do not accept everyone.
              </p>
              <p className="text-2xl text-muted-foreground leading-relaxed">
                We work with a <span className="text-foreground font-bold">limited number</span> of performers.
              </p>
              <p className="text-2xl text-muted-foreground leading-relaxed">
                We invest heavily in <span className="text-foreground font-bold">selected talent</span>.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ACT 7: REALITY CHECK */}
      <section className="py-32 px-6 bg-card/30">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-6xl md:text-8xl font-black text-foreground mb-12">
              THE REALITY
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
              {[
                "Explicit adult content",
                "Solo productions",
                "Amateur productions",
                "Partner productions",
                "Live cam opportunities",
                "Fanclub content creation",
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="flex items-center gap-4 p-6 bg-background"
                >
                  <Check className="w-6 h-6 text-primary shrink-0" />
                  <span className="text-lg text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* APPLICATION - At The Very End */}
      <section id="application-form" className="py-32 px-6 bg-background">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-black text-foreground mb-4">
              READY TO<br />
              <span className="text-primary">JOIN?</span>
            </h2>
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