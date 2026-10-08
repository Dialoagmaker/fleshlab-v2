import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, AlertCircle, FileText, PenTool } from "lucide-react";

export default function SignContract() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    signer_name: "",
    signer_email: "",
    signature_text: "",
    consent_checked: false,
  });

  useEffect(() => {
    if (!token) {
      setError("Missing signing token");
      setLoading(false);
      return;
    }

    loadContract();
  }, [token]);

  const loadContract = async () => {
    try {
      const res = await base44.functions.invoke("contractService", {
        action: "get_for_signing",
        signing_token: token,
      });

      if (res.data?.success) {
        setContract(res.data.contract);
      } else {
        setError(res.data?.error || "Failed to load contract");
      }
    } catch (err) {
      setError(err.message || "Failed to load contract");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.consent_checked) {
      toast.error("You must confirm the consent checkbox");
      return;
    }

    if (!formData.signature_text.trim()) {
      toast.error("Please enter your signature");
      return;
    }

    if (!formData.signer_name.trim() || !formData.signer_email.trim()) {
      toast.error("Please fill in your name and email");
      return;
    }

    setSigning(true);

    try {
      const res = await base44.functions.invoke("contractService", {
        action: "submit_signature",
        signing_token: token,
        ...formData,
      });

      if (res.data?.success) {
        setSuccess(true);
        toast.success("Contract signed successfully");
      } else {
        toast.error(res.data?.error || "Failed to sign contract");
      }
    } catch (err) {
      toast.error(err.message || "Failed to sign contract");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading contract...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Contract Signed Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Thank you, <strong>{formData.signer_name}</strong>. Your contract has been signed and FLESHLAB has been notified.
            </p>
            <p className="text-sm text-muted-foreground">
              A copy of the signed contract will be available in your performer dashboard once your account is activated.
            </p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">FLESHLAB Contract Signing</h1>
          <p className="text-muted-foreground">
            Please review and sign the contract below
          </p>
        </div>

        {/* Contract Content */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-foreground">{contract?.title || "Contract"}</h2>
          </div>
          <div 
            className="max-h-[65vh] overflow-y-auto p-2 bg-background rounded-lg"
            style={{
              background: "#f0f0f0",
            }}
          >
            <div 
              className="bg-white rounded shadow-lg"
              style={{
                minHeight: "800px",
              }}
              dangerouslySetInnerHTML={{ __html: contract?.generated_html || "" }}
            />
          </div>
        </div>

        {/* Signature Form */}
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Sign Contract
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signer_name">Full Legal Name *</Label>
                  <Input
                    id="signer_name"
                    value={formData.signer_name}
                    onChange={(e) => setFormData({ ...formData, signer_name: e.target.value })}
                    placeholder="Enter your full legal name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signer_email">Email Address *</Label>
                  <Input
                    id="signer_email"
                    type="email"
                    value={formData.signer_email}
                    onChange={(e) => setFormData({ ...formData, signer_email: e.target.value })}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature_text">Typed Signature *</Label>
                <Input
                  id="signature_text"
                  value={formData.signature_text}
                  onChange={(e) => setFormData({ ...formData, signature_text: e.target.value })}
                  placeholder="Type your full name as signature"
                  className="font-script text-lg"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This electronic signature is legally binding
                </p>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg border">
                <Checkbox
                  id="consent"
                  checked={formData.consent_checked}
                  onCheckedChange={(checked) => setFormData({ ...formData, consent_checked: checked })}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <Label htmlFor="consent" className="text-sm font-normal cursor-pointer">
                    I confirm that I have read and agree to this contract and that my electronic signature is legally binding. *
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By checking this box, you acknowledge that you are at least 18 years of age and voluntarily agree to all terms.
                  </p>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={signing || !formData.consent_checked}
              >
                {signing ? "Signing..." : "Sign Contract"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}