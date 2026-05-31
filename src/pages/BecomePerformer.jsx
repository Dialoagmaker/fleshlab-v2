import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Check, AlertCircle, Mail, Phone, Globe, Video, ImageIcon, User, Camera, Heart, Play } from "lucide-react";
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
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-8xl font-black text-foreground mb-6 leading-tight tracking-tight">
              Already Making Money<br />
              <span className="text-primary">With Your Body?</span>
            </h1>
            <p className="text-lg md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Escorts. Callboys. Cam models. Content sellers.<br />
              We turn one-time attention into a long-term adult brand.
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-12 py-6 text-xl shadow-2xl shadow-primary/40"
              onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Apply Now — 3 Minutes
            </Button>
          </motion.div>
        </div>
      </section>

      {/* What You Actually Do - Visual Grid */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              What You Actually Do
            </h2>
            <p className="text-muted-foreground">This is adult entertainment.</p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Camera, label: "Solo Content" },
              { icon: Video, label: "Homemade" },
              { icon: User, label: "Partner Scenes" },
              { icon: Play, label: "Live Cam" },
              { icon: Heart, label: "Fanclub" },
              { icon: Check, label: "Promo" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="p-6 rounded-xl bg-card/50 border border-border hover:border-primary/50 transition-colors text-center"
              >
                <item.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How You Earn - Simple Cards */}
      <section className="py-16 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              How You Earn
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-background border border-primary/30"
            >
              <div className="mb-4">
                <h3 className="text-3xl font-bold text-foreground mb-1">Full Management</h3>
                <p className="text-muted-foreground">We handle everything</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black text-primary">60</span>
                  <span className="text-2xl text-muted-foreground">%</span>
                </div>
                <p className="text-sm text-muted-foreground">You keep 60% • Studio takes 40%</p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Exclusive representation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Brand building
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Production planning
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Marketing and distribution
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Fanclub management
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-secondary to-background border border-border"
            >
              <div className="mb-4">
                <h3 className="text-3xl font-bold text-foreground mb-1">Independent Support</h3>
                <p className="text-muted-foreground">Platform only</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black text-primary">70</span>
                  <span className="text-2xl text-muted-foreground">%</span>
                </div>
                <p className="text-sm text-muted-foreground">You keep 70% • Studio takes 30%</p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Platform distribution
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Payment processing
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Basic analytics
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Upload infrastructure
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Studio Management - Simple Statement */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Check className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Exclusive Representation
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              FLESHLAB works with a limited number of selected performers.
              We build performer brands under exclusive management.
              This is not an open creator marketplace.
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="p-4 rounded-xl bg-card/50 border border-border">
                <h3 className="font-bold text-foreground mb-2">We Handle</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Content planning</li>
                  <li>• Distribution</li>
                  <li>• Marketing</li>
                  <li>• Fanclub setup</li>
                  <li>• Brand development</li>
                  <li>• Contracts</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-card/50 border border-border">
                <h3 className="font-bold text-foreground mb-2">Not A</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Dating app</li>
                  <li>• Self-upload platform</li>
                  <li>• OnlyFans management only</li>
                  <li>• Hookup site</li>
                  <li>• General creator platform</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Requirements - Ultra Simple */}
      <section className="py-16 px-6 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Requirements
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground mb-4">Must Have</h3>
              <ul className="space-y-3">
                {[
                  "18+ years old",
                  "Valid ID (passport, national ID, or driver license)",
                  "Modern smartphone for video",
                  "Stable internet connection",
                  "Comfortable with adult entertainment"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground mb-4">For Live Cam</h3>
              <ul className="space-y-3">
                {[
                  "Laptop or desktop computer",
                  "Webcam or smartphone setup",
                  "High-speed internet"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-4">
                Professional equipment not required when applying.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Process - Compact */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Application Process
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { num: 1, title: "Apply", desc: "3 min form" },
              { num: 2, title: "Review", desc: "48 hours" },
              { num: 3, title: "Interview", desc: "Call" },
              { num: 4, title: "Verify", desc: "ID check" },
              { num: 5, title: "Contract", desc: "Sign" },
              { num: 6, title: "Launch", desc: "Start earning" },
            ].map((item) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: item.num * 0.05 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 font-bold">
                  {item.num}
                </div>
                <p className="font-bold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-card/30 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-black text-foreground mb-6">
              Ready To Build More Than<br />
              <span className="text-primary">One Client At A Time?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              If people already pay for your attention, FLESHLAB can help turn that attention into content, fans and a long-term adult brand.
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-12 py-6 text-xl shadow-2xl shadow-primary/40"
              onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Apply Now
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Takes 3 minutes. Private and secure. Response within 48 hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Application Form */}
      <section id="application-form" className="py-20 px-6 bg-background">
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