import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Check, AlertCircle, Lock, Mail, Phone, Globe, Video, Image, User } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Not perfect.<br />
              <span className="text-primary">Just real.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Gay / bi / queer guys wanted.<br />
              Create content. Build fans. Earn with FLESHLAB.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Apply in 3 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Private and secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Get paid</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
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
            className="bg-card border border-border rounded-2xl p-8 shadow-xl"
          >
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Basic Info</h2>
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
                  <h2 className="text-3xl font-bold text-foreground mb-2">Experience and Path</h2>
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
                  <h2 className="text-3xl font-bold text-foreground mb-2">Photos and Consent</h2>
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

          <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>Your information is kept strictly confidential and only accessible to authorized admin staff.</p>
            <p className="mt-1">We never share your data with third parties without your explicit consent.</p>
          </div>
        </div>
      </section>
    </div>
  );
}