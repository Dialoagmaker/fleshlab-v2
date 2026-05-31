import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Check, AlertCircle, Mail, Phone, Globe, Video, ImageIcon, User, Camera, Heart, Play, TrendingUp, DollarSign, Users, Shield, Star, Zap, MessageCircle, Film, Mic, Calendar } from "lucide-react";
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

// Performer showcase data
const featuredPerformers = [
  {
    name: "Alex",
    age: 24,
    location: "Taipei",
    path: "Studio Performer",
    image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png",
    stats: { videos: 12, fans: "2.4K", revenue: "Growing" }
  },
  {
    name: "Marco",
    age: 26,
    location: "Bangkok",
    path: "Live Cam + Fanclub",
    image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png",
    stats: { videos: 8, fans: "1.8K", revenue: "Recurring" }
  },
  {
    name: "Jay",
    age: 23,
    location: "Manila",
    path: "Content Creator",
    image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png",
    stats: { videos: 15, fans: "3.1K", revenue: "Scaling" }
  },
];

const lifestyleMoments = [
  { icon: Camera, label: "Creating Content", desc: "Your phone. Your pace." },
  { icon: Users, label: "Building Fans", desc: "People who follow YOU." },
  { icon: Play, label: "Live Shows", desc: "Real-time connection." },
  { icon: Heart, label: "Fanclub", desc: "Recurring support." },
  { icon: Film, label: "Studio Productions", desc: "Professional scenes." },
  { icon: TrendingUp, label: "Growing Brand", desc: "Long-term career." },
];

const revenueStreams = [
  { icon: Film, label: "Video Productions", desc: "One-time + residuals" },
  { icon: Heart, label: "Fanclub Subscriptions", desc: "Monthly recurring" },
  { icon: Play, label: "Live Cam Shows", desc: "Tips + private shows" },
  { icon: DollarSign, label: "Tips & Donations", desc: "Direct fan support" },
  { icon: Star, label: "Promotions", desc: "Brand partnerships" },
  { icon: Users, label: "Partner Projects", desc: "Collaborative content" },
];

export default function BecomePerformer() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    stage_name: "",
    legal_name: "",
    age_confirmed: false,
    country: "",
    email: "",
    phone: "",
    telegram: "",
    whatsapp: "",
    line: "",
    preferred_contact: "email",
    content_experience: "",
    preferred_path: "",
    social_links: "",
    consent_confirmed: false,
    privacy_accepted: false,
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    photos: [],
    video: null,
  });

  const [isUploading, setIsUploading] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        applicant_name: data.stage_name,
        email: data.email,
        phone: data.phone || data.telegram || data.whatsapp || data.line,
        nationality: data.country,
        message: `Path: ${data.preferred_path}\nExperience: ${data.content_experience}\nSocial: ${data.social_links}\nLegal Name: ${data.legal_name}`,
        package_interest: data.preferred_path,
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
    
    setIsUploading(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file: file });
      
      if (type === "photo") {
        setUploadedFiles(prev => ({
          ...prev,
          photos: [...prev.photos, response.file_url]
        }));
      } else if (type === "video") {
        setUploadedFiles(prev => ({
          ...prev,
          video: response.file_url
        }));
      }
      
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
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
           formData.country && formData.email && formData.preferred_contact;
  };

  const canProceedToStep3 = () => {
    return formData.preferred_path && formData.content_experience;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HERO - Pure Aspiration */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/70 to-background/90 z-0" />
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-9xl font-black text-foreground mb-8 leading-tight tracking-tight">
              Your Audience<br />
              <span className="text-primary">Is Waiting.</span>
            </h1>
            <p className="text-xl md:text-3xl text-muted-foreground mb-12 max-w-3xl mx-auto font-light">
              Turn attention into a career.<br />
              Build a brand that lasts.
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-16 py-8 text-2xl shadow-2xl shadow-primary/40"
              onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Become A Performer
            </Button>
          </motion.div>
        </div>
      </section>

      {/* MEET THE MEN - Social Proof */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-6">
              Meet The Men Of<br />
              <span className="text-primary">FLESHLAB.</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real creators. Real brands. Real income.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {featuredPerformers.map((performer, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="group relative overflow-hidden rounded-2xl bg-card border border-border"
              >
                <div className="aspect-[3/4] relative">
                  <img
                    src={performer.image}
                    alt={performer.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-foreground">{performer.name}, {performer.age}</h3>
                    <p className="text-sm text-muted-foreground">{performer.location} • {performer.path}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">{performer.stats.videos}</p>
                      <p className="text-xs text-muted-foreground">Videos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{performer.stats.fans}</p>
                      <p className="text-xs text-muted-foreground">Fans</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{performer.stats.revenue}</p>
                      <p className="text-xs text-muted-foreground">Income</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LIFESTYLE - Visual Journey */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-6">
              Life Inside<br />
              <span className="text-primary">FLESHLAB.</span>
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {lifestyleMoments.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-background border border-primary/30 text-center hover:border-primary/60 transition-colors"
              >
                <item.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">{item.label}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRANSFORMATION - Before/After */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-6">
              From Attention<br />
              <span className="text-primary">To A Brand.</span>
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
              <h3 className="text-3xl font-bold text-foreground mb-6">Before</h3>
              <ul className="space-y-4">
                {[
                  "Random customers",
                  "One-off transactions",
                  "Inconsistent income",
                  "No audience ownership",
                  "Limited growth"
                ].map((item, idx) => (
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
              <h3 className="text-3xl font-bold text-foreground mb-6">After</h3>
              <ul className="space-y-4">
                {[
                  "Dedicated fanbase",
                  "Recurring revenue",
                  "Content library",
                  "Brand ownership",
                  "Long-term career"
                ].map((item, idx) => (
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

      {/* WHAT PERFORMERS DO - Direct & Clear */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-6">
              What You'll<br />
              <span className="text-primary">Create.</span>
            </h2>
            <p className="text-xl text-muted-foreground">Adult entertainment. Professional productions.</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              "Solo productions",
              "Amateur content",
              "Homemade videos",
              "Fanclub exclusives",
              "Partner scenes",
              "Studio collaborations",
              "Live cam shows",
              "Promotional content"
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="p-6 rounded-xl bg-background border border-border"
              >
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-medium">{item}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY JOIN - Benefits */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-6">
              Why Performers<br />
              <span className="text-primary">Join.</span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Audience Growth",
                desc: "We help you find and grow your fanbase."
              },
              {
                icon: Play,
                title: "Content Distribution",
                desc: "Multi-platform reach. Maximum visibility."
              },
              {
                icon: Star,
                title: "Brand Development",
                desc: "Build something that lasts beyond today."
              },
              {
                icon: Users,
                title: "Marketing Support",
                desc: "Promotion, campaigns, and audience engagement."
              },
              {
                icon: Heart,
                title: "Fanclub Setup",
                desc: "Recurring revenue from dedicated fans."
              },
              {
                icon: Film,
                title: "Production Planning",
                desc: "Professional content strategy and scheduling."
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="p-8 rounded-2xl bg-card/50 border border-border"
              >
                <item.icon className="w-12 h-12 text-primary mb-6" />
                <h3 className="text-2xl font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW YOU EARN - Visual */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-6">
              How You<br />
              <span className="text-primary">Earn.</span>
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
                className="p-6 rounded-xl bg-gradient-to-br from-background to-card border border-border text-center"
              >
                <item.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-sm font-bold text-foreground mb-2">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMISSION - Simple Statement */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-8">
              You Keep<br />
              <span className="text-primary">60-70%.</span>
            </h2>
            <p className="text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              Full Management: 60% to you<br />
              Independent Support: 70% to you
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="p-8 rounded-2xl bg-primary/10 border border-primary/30">
                <h3 className="text-2xl font-bold text-foreground mb-4">Full Management</h3>
                <p className="text-muted-foreground">We handle everything: brand, production, marketing, fanclub, distribution.</p>
              </div>
              <div className="p-8 rounded-2xl bg-secondary/30 border border-border">
                <h3 className="text-2xl font-bold text-foreground mb-4">Independent Support</h3>
                <p className="text-muted-foreground">You manage production. We provide platform and infrastructure.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* EXCLUSIVE - Premium Feel */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Star className="w-16 h-16 text-primary mx-auto mb-8" />
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-8">
              Exclusive.<br />
              <span className="text-primary">Selective.</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              FLESHLAB works with a limited number of performers.<br />
              We invest long-term in building creator brands.<br />
              This is not an open marketplace.
            </p>
          </motion.div>
        </div>
      </section>

      {/* REQUIREMENTS - Minimal */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-6">
              Requirements.
            </h2>
          </motion.div>
          
          <div className="p-10 rounded-2xl bg-card/50 border border-border">
            <ul className="space-y-4">
              {[
                "18+ years old",
                "Valid ID (passport, national ID, or driver license)",
                "Modern smartphone for video",
                "Stable internet connection",
                "Comfortable with adult entertainment"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-4">
                  <Check className="w-6 h-6 text-primary shrink-0" />
                  <span className="text-lg text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mt-8">
              Professional equipment not required when applying.
            </p>
          </div>
        </div>
      </section>

      {/* PROCESS - Simple */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-6">
              The Process.
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { num: 1, title: "Apply", desc: "3 minutes" },
              { num: 2, title: "Review", desc: "48 hours" },
              { num: 3, title: "Interview", desc: "Call" },
              { num: 4, title: "Verify", desc: "ID" },
              { num: 5, title: "Launch", desc: "Start" },
            ].map((item) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: item.num * 0.05 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-black text-xl">
                  {item.num}
                </div>
                <p className="font-bold text-foreground mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
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
              Ready To Build<br />
              <span className="text-primary">Something Bigger?</span>
            </h2>
            <p className="text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              Your audience is waiting.<br />
              Turn attention into a career.
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-20 py-10 text-3xl shadow-2xl shadow-primary/40"
              onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Apply Now
            </Button>
            <p className="text-sm text-muted-foreground mt-6">
              Takes 3 minutes. Private. Response within 48 hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* APPLICATION FORM - Now */}
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
              Application
            </h2>
            <p className="text-muted-foreground">Private and secure.</p>
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    step >= s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>
                    {s}
                  </div>
                  {s < 3 && (
                    <div className={`w-8 h-0.5 transition-colors ${
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
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="stage_name">Stage Name</Label>
                      <Input
                        id="stage_name"
                        value={formData.stage_name}
                        onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
                        placeholder="Performer name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legal_name">Legal Name (Private)</Label>
                      <Input
                        id="legal_name"
                        value={formData.legal_name}
                        onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                        placeholder="Real name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.age_confirmed}
                        onCheckedChange={(checked) => setFormData({ ...formData, age_confirmed: checked })}
                      />
                      I am 18+ years old
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Where are you based?"
                    />
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
                    <Label htmlFor="phone">Phone / Telegram / WhatsApp</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Contact number or username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Contact</Label>
                    <Select
                      value={formData.preferred_contact}
                      onValueChange={(value) => setFormData({ ...formData, preferred_contact: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!canProceedToStep2() || submitMutation.isPending}
                    onClick={() => setStep(2)}
                  >
                    Continue
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="preferred_path">What interests you?</Label>
                    <Select
                      value={formData.preferred_path}
                      onValueChange={(value) => setFormData({ ...formData, preferred_path: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="studio_performer">Studio Performer</SelectItem>
                        <SelectItem value="live_cam">Live Cam</SelectItem>
                        <SelectItem value="fanclub_creator">Fanclub Creator</SelectItem>
                        <SelectItem value="fan_production">Fan Production</SelectItem>
                        <SelectItem value="not_sure">Not Sure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience</Label>
                    <Textarea
                      id="experience"
                      value={formData.content_experience}
                      onChange={(e) => setFormData({ ...formData, content_experience: e.target.value })}
                      placeholder="Tell us about your experience (beginners welcome)"
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social">Social Media (optional)</Label>
                    <Textarea
                      id="social"
                      value={formData.social_links}
                      onChange={(e) => setFormData({ ...formData, social_links: e.target.value })}
                      placeholder="Twitter, Instagram, OnlyFans, etc."
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
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Photos (Required)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            Array.from(e.target.files).forEach(file => {
                              handleFileUpload(file, "photo");
                            });
                          }
                        }}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <ImageIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Upload 2-4 photos (face + body)</p>
                      </label>
                    </div>
                    {uploadedFiles.photos.length > 0 && (
                      <div className="flex gap-2">
                        {uploadedFiles.photos.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Upload ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded border border-border"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Video (Optional)</Label>
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
                        <Video className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Upload intro/demo video</p>
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
                      <AlertDescription>
                        {submitMutation.error.message}
                      </AlertDescription>
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

          <p className="text-center text-xs text-muted-foreground mt-6">
            Your information is kept strictly confidential.
          </p>
        </div>
      </section>
    </div>
  );
}