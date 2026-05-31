import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Check, AlertCircle, Lock, Mail, Phone, Globe, Video, Image, User, Camera, Sparkles, TrendingUp, FileText, DollarSign, Users, Calendar, Shield, Star, Zap } from "lucide-react";
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
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-border">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/85 to-background/95 z-0" />
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Camera className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Turn Your Sex Appeal<br />
              <span className="text-primary">Into a Real Brand.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Stop chasing one customer at a time.<br />
              Build a fanbase. Create content. Earn long-term.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 py-4 text-lg shadow-lg shadow-primary/30"
                onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Apply Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border hover:border-primary/50 font-semibold px-10 py-4 text-lg"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                How It Works
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reality Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-background to-card/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              You're Probably Already Doing This.
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Many men already make money through escort work, private clients, content sales, cam work, subscriptions, and direct messages.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-background border border-primary/30"
          >
            <div className="flex items-start gap-4 mb-6">
              <TrendingUp className="w-8 h-8 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-3">The Difference?</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  FLESHLAB helps you build something that can continue generating income long after a single booking ends.
                  We transform individual transactions into a sustainable business with recurring revenue, loyal fans, and long-term growth.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What FLESHLAB Does */}
      <section className="py-20 px-6 bg-gradient-to-b from-card/30 to-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              More Than Just Content.
            </h2>
            <p className="text-xl text-muted-foreground">
              We are a creator studio. Not a dating platform. Not a hookup app.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Camera, title: "Content Production", desc: "Professional shoots, 4K equipment, premium setups" },
              { icon: TrendingUp, title: "Branding", desc: "Build your unique identity and market position" },
              { icon: Users, title: "Social Media Growth", desc: "Strategic promotion across all platforms" },
              { icon: DollarSign, title: "Fanclub Development", desc: "Recurring revenue from dedicated fans" },
              { icon: Zap, title: "Content Distribution", desc: "Multi-platform reach and optimization" },
              { icon: Star, title: "Marketing", desc: "Professional campaigns and audience targeting" },
              { icon: FileText, title: "Platform Management", desc: "We handle the technical infrastructure" },
              { icon: User, title: "Studio Support", desc: "Dedicated team for your success" },
              { icon: Sparkles, title: "Revenue Optimization", desc: "Maximize earnings from every asset" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.05 }}
                className="p-6 rounded-xl bg-card/50 border border-border hover:border-primary/30 transition-colors"
              >
                <item.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We're Looking For */}
      <section className="py-20 px-6 bg-gradient-to-b from-background to-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Who Can Apply?
            </h2>
            <p className="text-xl text-muted-foreground">
              No previous studio experience required.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Twinks",
              "Jocks",
              "Boy-next-door",
              "Slim",
              "Athletic",
              "Muscular",
              "Gay",
              "Bi",
              "Curious newcomers",
              "Experienced creators",
              "First-timers",
              "Industry veterans"
            ].map((type, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="p-4 rounded-xl bg-card border border-border text-center"
              >
                <p className="text-foreground font-semibold">{type}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Adult Content Transparency */}
      <section className="py-20 px-6 bg-gradient-to-b from-card/30 to-background">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 rounded-2xl bg-gradient-to-br from-destructive/10 to-background border border-destructive/30"
          >
            <div className="flex items-start gap-4 mb-6">
              <AlertCircle className="w-8 h-8 text-destructive shrink-0 mt-1" />
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Will I Appear In Adult Content?
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  <strong className="text-foreground">Yes.</strong>
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  FLESHLAB is an adult entertainment studio. Most productions contain explicit sexual content for adult audiences.
                  Applicants should be comfortable working in the adult entertainment industry.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Nothing is produced without performer approval and agreement. You maintain control over your content and boundaries.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Revenue Models */}
      <section id="how-it-works" className="py-20 px-6 bg-gradient-to-b from-background to-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Revenue Models
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose the path that fits your goals
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-background border border-primary/30"
            >
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-bl-lg rounded-tr-lg">
                MOST POPULAR
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">Full Management</h3>
                <p className="text-muted-foreground">We handle everything</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-6xl font-bold text-primary">60</span>
                  <span className="text-2xl text-muted-foreground">%</span>
                </div>
                <p className="text-sm text-muted-foreground">Your revenue share</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Full production support",
                  "Marketing & promotion",
                  "Fan management",
                  "Contract negotiation",
                  "Payment processing"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">You keep 60%</strong> – We handle production, marketing, and fan engagement so you can focus on creating.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-secondary to-background border border-border"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">Independent Creator</h3>
                <p className="text-muted-foreground">DIY with platform access</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-6xl font-bold text-primary">70</span>
                  <span className="text-2xl text-muted-foreground">%</span>
                </div>
                <p className="text-sm text-muted-foreground">Your revenue share</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Platform distribution",
                  "Payment processing",
                  "Basic analytics",
                  "Upload your own content",
                  "Set your own schedule"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">You keep 70%</strong> – You manage production and promotion, we provide the platform and audience.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20 px-6 bg-gradient-to-b from-card/30 to-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Application Process
            </h2>
            <p className="text-xl text-muted-foreground">
              Six steps from application to launch
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { step: 1, title: "Application", desc: "Fill out the form below", icon: FileText },
              { step: 2, title: "Review", desc: "We review within 48 hours", icon: User },
              { step: 3, title: "Interview", desc: "Schedule a call with our team", icon: Phone },
              { step: 4, title: "Identity Verification", desc: "Passport, ID, or driver license", icon: Shield },
              { step: 5, title: "Contract", desc: "Sign agreement and set terms", icon: FileText },
              { step: 6, title: "Production & Launch", desc: "Start creating and earning", icon: Camera },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="relative p-6 rounded-xl bg-card/50 border border-border"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold text-lg">
                    {item.step}
                  </div>
                  <div>
                    <item.icon className="w-6 h-6 text-primary mb-2" />
                    <h3 className="text-lg font-bold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Identity Verification Info */}
      <section className="py-20 px-6 bg-gradient-to-b from-background to-card/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 rounded-2xl bg-card/50 border border-border"
          >
            <div className="flex items-start gap-4 mb-6">
              <Shield className="w-8 h-8 text-primary shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Identity Verification
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Approved applicants will be required to provide government-issued identification:
                </p>
                <ul className="grid md:grid-cols-2 gap-3 mb-6">
                  {[
                    "Passport",
                    "National ID",
                    "Driver License",
                    "Recent photos",
                    "Intro videos"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground">
                  This is for age verification, compliance, and performer protection. All documents are stored securely and handled confidentially.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Application Form */}
      <section id="application-form" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Apply Now
            </h2>
            <p className="text-xl text-muted-foreground">
              Takes 3 minutes. Private and secure.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-8 shadow-xl"
          >
            {/* Step indicators */}
            <div className="flex items-center justify-center gap-4 mb-12">
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
                    <h3 className="text-2xl font-bold text-foreground mb-2">Basic Info</h3>
                    <p className="text-muted-foreground">Let's start with the basics</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="stage_name">Stage Name (Public)</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="stage_name"
                          value={formData.stage_name}
                          onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
                          className="pl-10"
                          placeholder="Your performer name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="legal_name">Legal Name (Private)</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="legal_name"
                          value={formData.legal_name}
                          onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                          className="pl-10"
                          placeholder="Your real name"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.age_confirmed}
                        onCheckedChange={(checked) => setFormData({ ...formData, age_confirmed: checked })}
                      />
                      I confirm I am 18 years or older
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country / Location</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="pl-10"
                        placeholder="Where are you based?"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone or Messaging</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      value={formData.telegram}
                      onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                      placeholder="Telegram @username"
                    />
                    <Input
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="WhatsApp number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Contact Method</Label>
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
                        <SelectItem value="line">LINE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full mt-6"
                    size="lg"
                    disabled={!canProceedToStep2() || submitMutation.isPending}
                    onClick={() => setStep(2)}
                  >
                    Continue to Step 2
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-2">Experience and Path</h3>
                    <p className="text-muted-foreground">Tell us about yourself</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferred_path">What interests you?</Label>
                    <Select
                      value={formData.preferred_path}
                      onValueChange={(value) => setFormData({ ...formData, preferred_path: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your path" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="studio_performer">Studio Performer (Scene work)</SelectItem>
                        <SelectItem value="live_cam">Live Cam Performer</SelectItem>
                        <SelectItem value="fanclub_creator">Fanclub Creator (Exclusive content)</SelectItem>
                        <SelectItem value="fan_production">Fan Production (Guest scenes)</SelectItem>
                        <SelectItem value="not_sure">Not Sure Yet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Content Experience</Label>
                    <Textarea
                      id="experience"
                      value={formData.content_experience}
                      onChange={(e) => setFormData({ ...formData, content_experience: e.target.value })}
                      placeholder="Tell us about your experience (or lack thereof - beginners welcome!)"
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social">Social Media Links</Label>
                    <Textarea
                      id="social"
                      value={formData.social_links}
                      onChange={(e) => setFormData({ ...formData, social_links: e.target.value })}
                      placeholder="Twitter, Instagram, OnlyFans, etc. (optional)"
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      size="lg"
                      disabled={!canProceedToStep3() || submitMutation.isPending}
                      onClick={() => setStep(3)}
                    >
                      Continue to Step 3
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-2">Photos and Consent</h3>
                    <p className="text-muted-foreground">Final step - upload photos and confirm</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Profile Photos (Required)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
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
                        <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload 2-4 clear photos (face + body)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 10MB each
                        </p>
                      </label>
                    </div>
                    {uploadedFiles.photos.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {uploadedFiles.photos.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Upload ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded border border-border"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Intro / Demo Video (Optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
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
                        <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload a short intro or demo video
                        </p>
                        <p className="text-xs text-muted-foreground">
                          MP4, MOV up to 100MB
                        </p>
                      </label>
                    </div>
                    {uploadedFiles.video && (
                      <video
                        src={uploadedFiles.video}
                        controls
                        className="w-full max-w-md mx-auto rounded border border-border mt-2"
                      />
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="consent"
                        checked={formData.consent_confirmed}
                        onCheckedChange={(checked) => setFormData({ ...formData, consent_confirmed: checked })}
                      />
                      <Label htmlFor="consent" className="font-normal text-sm">
                        I confirm all information is accurate and I consent to FLESHLAB contacting me regarding my application.
                      </Label>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="privacy"
                        checked={formData.privacy_accepted}
                        onCheckedChange={(checked) => setFormData({ ...formData, privacy_accepted: checked })}
                      />
                      <Label htmlFor="privacy" className="font-normal text-sm">
                        I accept the Privacy Policy and understand my data will be stored securely and used only for application processing.
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
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(2)}
                    >
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

          <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>Your information is kept strictly confidential and only accessible to authorized admin staff.</p>
            <p className="mt-1">We never share your data with third parties without your explicit consent.</p>
          </div>
        </div>
      </section>
    </div>
  );
}