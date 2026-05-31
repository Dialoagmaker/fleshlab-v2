import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Check, ArrowRight, Play, Users, TrendingUp, Camera, Heart, Film, DollarSign, Shield, Calendar, MessageCircle, Star, Zap, MapPin, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

// Real performer data
const performers = [
  { name: "Marco", age: 24, location: "Bangkok", months: 18, fans: "3.2K", videos: 24, path: "Full Management", image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png" },
  { name: "Alex", age: 26, location: "Taipei", months: 12, fans: "2.8K", videos: 18, path: "Live Cam + Content", image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png" },
  { name: "Jay", age: 23, location: "Manila", months: 24, fans: "4.1K", videos: 36, path: "Full Management", image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png" },
  { name: "Rio", age: 25, location: "Tokyo", months: 15, fans: "3.5K", videos: 21, path: "Studio + Fanclub", image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png" },
];

const revenueStreams = [
  { icon: Film, label: "Video Productions", desc: "Scene work + residuals" },
  { icon: Heart, label: "Fanclub", desc: "Monthly subscriptions" },
  { icon: Play, label: "Live Cam", desc: "Tips + private shows" },
  { icon: DollarSign, label: "Direct Tips", desc: "Fan appreciation" },
  { icon: Star, label: "Promotions", desc: "Brand partnerships" },
  { icon: Camera, label: "Custom Content", desc: "Premium requests" },
];

const performerTypes = [
  {
    title: "THE NATURAL",
    desc: "Already selling content. Knows what works. Ready to scale.",
    icon: Zap
  },
  {
    title: "THE CURIOUS",
    desc: "Never done it before. Interested in adult work. Needs guidance.",
    icon: Star
  },
  {
    title: "THE HUSTLER",
    desc: "Escort or callboy. Wants recurring revenue. Building a brand.",
    icon: TrendingUp
  },
  {
    title: "THE PERFORMER",
    desc: "Loves being on camera. Natural entertainer. Wants professional production.",
    icon: Camera
  },
];

export default function BecomePerformer() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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
    preferred_contact: "email",
    interests: [],
    experience: "",
    social_links: "",
    consent_confirmed: false,
    privacy_accepted: false,
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    photos: [],
    video: null,
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
        id_document_url: uploadedFiles.photos.length > 0 ? uploadedFiles.photos[0] : null,
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

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    try {
      const response = await base44.integrations.Core.UploadFile({ file: file });
      if (type === "video") {
        setUploadedFiles(prev => ({ ...prev, video: response.file_url }));
      }
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
    }
  };

  const handleSubmit = () => {
    if (!formData.consent_confirmed || !formData.privacy_accepted) {
      toast.error("Please confirm consent and accept privacy policy");
      return;
    }
    submitMutation.mutate(formData);
  };

  const canProceedToStep2 = () => {
    return formData.stage_name && formData.legal_name && formData.age_confirmed && 
           formData.country && formData.email;
  };

  const canProceedToStep3 = () => {
    return formData.interests.length > 0;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HERO - Full Screen Impact */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background z-0" />
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-9xl font-black text-foreground mb-6 leading-tight">
              GET PAID TO BE<br />
              <span className="text-primary">WHO YOU ALREADY ARE.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto font-light">
              FLESHLAB builds adult performer brands.<br />
              We're looking for the next generation.
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-16 py-8 text-2xl shadow-2xl shadow-primary/40"
              onClick={() => document.getElementById('performers')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See If You Qualify
            </Button>
          </motion.div>
        </div>
      </section>

      {/* THE GUYS - Performer Showcase */}
      <section id="performers" className="py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-4">
              THE GUYS.
            </h2>
            <p className="text-xl text-muted-foreground">Real performers. Real results.</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performers.map((performer, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="group relative overflow-hidden rounded-2xl bg-card border border-border cursor-pointer"
              >
                <div className="aspect-[3/4] relative">
                  <img
                    src={performer.image}
                    alt={performer.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-foreground">{performer.name}, {performer.age}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {performer.location} • {performer.path}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xl font-bold text-primary">{performer.months}m</p>
                      <p className="text-xs text-muted-foreground">Time</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-primary">{performer.fans}</p>
                      <p className="text-xs text-muted-foreground">Fans</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-primary">{performer.videos}</p>
                      <p className="text-xs text-muted-foreground">Videos</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE BUILD - Studio Capabilities */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-4">
              WHAT WE BUILD.
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Film, title: "Content Production", desc: "Professional scenes. Amateur authenticity." },
              { icon: Users, title: "Brand Development", desc: "Your name. Your identity. Your audience." },
              { icon: Heart, title: "Fanclub Growth", desc: "Recurring revenue from dedicated fans." },
              { icon: TrendingUp, title: "Distribution Network", desc: "Multi-platform. Maximum reach." },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-background border border-primary/30"
              >
                <item.icon className="w-12 h-12 text-primary mb-6" />
                <h3 className="text-2xl font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LIFE AS A PERFORMER - Lifestyle */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-4">
              LIFE AS A<br />
              <span className="text-primary">FLESHLAB PERFORMER.</span>
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { icon: Camera, label: "Film on your schedule" },
              { icon: Heart, label: "Post exclusive content" },
              { icon: Play, label: "Go live for tips" },
              { icon: DollarSign, label: "Review earnings" },
              { icon: Calendar, label: "Plan productions" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="p-6 rounded-2xl bg-card/50 border border-border text-center"
              >
                <item.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                <p className="text-sm font-bold text-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRANSFORMATION - Before/After */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-4">
              FROM THIS<br />
              <span className="text-primary">TO THIS.</span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-10 rounded-2xl bg-secondary/30 border border-border"
            >
              <h3 className="text-3xl font-bold text-foreground mb-6">BEFORE</h3>
              <ul className="space-y-4">
                {["Random customers", "One-off payments", "No audience ownership", "Inconsistent income", "Limited growth"].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-10 rounded-2xl bg-gradient-to-br from-primary/10 to-background border border-primary/30"
            >
              <h3 className="text-3xl font-bold text-foreground mb-6">AFTER</h3>
              <ul className="space-y-4">
                {["Dedicated fanbase", "Recurring revenue", "Content library you own", "Predictable income", "Long-term brand"].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-foreground">
                    <Check className="w-5 h-5 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW YOU EARN - Revenue Streams */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-4">
              HOW YOU EARN.
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {revenueStreams.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-background to-card border border-border text-center"
              >
                <item.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-sm font-bold text-foreground mb-2">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xl text-muted-foreground mt-12">
            Performers keep <span className="text-primary font-bold">60-70%</span> depending on path
          </p>
        </div>
      </section>

      {/* PERFORMER TYPES - Self-Identification */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-4">
              ARE YOU THE TYPE?
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performerTypes.map((type, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="p-8 rounded-2xl bg-background border border-border"
              >
                <type.icon className="w-12 h-12 text-primary mb-6" />
                <h3 className="text-2xl font-bold text-foreground mb-4">{type.title}</h3>
                <p className="text-muted-foreground">{type.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EXCLUSIVE - Scarcity */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Star className="w-16 h-16 text-primary mx-auto mb-8" />
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-8">
              EXCLUSIVE.<br />
              <span className="text-primary">SELECTIVE.</span><br />
              SERIOUS.
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div>
                <p className="text-4xl font-black text-primary mb-2">10-15</p>
                <p className="text-muted-foreground">Performers per market</p>
              </div>
              <div>
                <p className="text-4xl font-black text-primary mb-2">12-18</p>
                <p className="text-muted-foreground">Months brand investment</p>
              </div>
              <div>
                <p className="text-4xl font-black text-primary mb-2">NOT</p>
                <p className="text-muted-foreground">An open platform</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* REQUIREMENTS - Minimal */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-4">
              WHAT YOU NEED.
            </h2>
          </motion.div>
          
          <div className="p-10 rounded-2xl bg-background border border-border">
            <ul className="space-y-4 mb-8">
              {["18+ years old", "Valid ID", "Smartphone with good camera", "Internet connection", "Comfortable with adult content"].map((item, idx) => (
                <li key={idx} className="flex items-center gap-4">
                  <Check className="w-6 h-6 text-primary shrink-0" />
                  <span className="text-lg text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground">That's it. No professional equipment needed.</p>
          </div>
        </div>
      </section>

      {/* PROCESS - Simple */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-4">
              HOW IT WORKS.
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { num: 1, title: "Apply", desc: "3 minutes", icon: Upload },
              { num: 2, title: "Talk", desc: "15-min call", icon: MessageCircle },
              { num: 3, title: "Verify", desc: "ID check", icon: Shield },
              { num: 4, title: "Plan", desc: "Your path", icon: Calendar },
              { num: 5, title: "Launch", desc: "First earnings", icon: Zap },
            ].map((item) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: item.num * 0.05 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8" />
                </div>
                <p className="font-bold text-foreground mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-muted-foreground mt-12">
            Most performers launch within <span className="text-primary font-bold">2-3 weeks</span>
          </p>
        </div>
      </section>

      {/* FINAL CTA - Massive */}
      <section className="py-32 px-6 bg-gradient-to-b from-background to-card/30">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-6xl md:text-8xl font-black text-foreground mb-8 leading-tight">
              YOUR AUDIENCE<br />
              <span className="text-primary">IS WAITING.</span>
            </h2>
            <p className="text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              Stop thinking about it.<br />
              Start building it.
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-20 py-10 text-3xl shadow-2xl shadow-primary/40"
              onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              START YOUR APPLICATION
            </Button>
            <p className="text-sm text-muted-foreground mt-6">
              3 minutes. Private. No obligation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* APPLICATION - Profile Creator */}
      <section id="application-form" className="py-24 px-6 bg-background">
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
            <p className="text-muted-foreground">Private. Secure. 4-5 minutes total.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    step >= s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>
                    {s}
                  </div>
                  {s < 3 && (
                    <div className={`w-12 h-1 rounded transition-colors ${
                      step > s ? "bg-primary" : "bg-secondary"
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-2">WHO ARE YOU?</h3>
                    <p className="text-muted-foreground">60 seconds</p>
                  </div>
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
                        placeholder="For contract later"
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
                    <Label htmlFor="phone">Phone or Messaging</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Phone, Telegram, or WhatsApp"
                    />
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!canProceedToStep2() || submitMutation.isPending}
                    onClick={() => setStep(2)}
                  >
                    Continue <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-2">WHAT'S YOUR PATH?</h3>
                    <p className="text-muted-foreground">90 seconds</p>
                  </div>
                  <div className="space-y-2">
                    <Label>What interests you? (Select all that apply)</Label>
                    <div className="grid md:grid-cols-2 gap-3">
                      {[
                        { value: "studio_scenes", label: "Studio scenes" },
                        { value: "live_cam", label: "Live cam" },
                        { value: "fanclub", label: "Fanclub content" },
                        { value: "all", label: "All of the above" },
                        { value: "not_sure", label: "Not sure yet" },
                      ].map((opt) => (
                        <div
                          key={opt.value}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
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
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      size="lg"
                      disabled={!canProceedToStep3() || submitMutation.isPending}
                      onClick={() => setStep(3)}
                    >
                      Continue <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-2">SHOW US</h3>
                    <p className="text-muted-foreground">2-3 minutes</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Photos (Required)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            // Handle photo uploads if needed
                          }
                        }}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          2-4 photos. Face + body. Selfies are fine.
                        </p>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Video Intro (Optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0], "video");
                          }
                        }}
                        className="hidden"
                        id="video-upload"
                      />
                      <label htmlFor="video-upload" className="cursor-pointer">
                        <Camera className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          30-60 sec intro. Phone video is perfect.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Not required. Just helpful.
                        </p>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-border">
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
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      size="lg"
                      disabled={submitMutation.isPending || !formData.consent_confirmed || !formData.privacy_accepted}
                      onClick={handleSubmit}
                    >
                      {submitMutation.isPending ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}