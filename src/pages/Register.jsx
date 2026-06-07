import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { getStoredAuthIntent, buildRedirectUrl, validateRedirectUrl } from "@/lib/authRedirect";
import SEOMeta from "@/components/SEOMeta";
import { trackRegistrationStarted } from "@/lib/analytics";

export default function Register() {
  // SEO: Prevent indexing of auth pages
  const noIndexMeta = (
    <SEOMeta
      title="Create Account"
      description="Create your FLESHLAB account"
      canonical="/register"
      noIndex={true}
    />
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Read ?next=, ?from_url=, ?checkout= from URL
  const urlParams = new URLSearchParams(window.location.search);
  const nextParam = urlParams.get("next") || urlParams.get("from_url") || null;
  const checkoutParam = urlParams.get("checkout") || null; // e.g., fanclub_monthly, fanclub_3mo
  const isFanProductionFlow = nextParam && nextParam.includes("/fan-productions");
  const isFanclubCheckout = checkoutParam && checkoutParam.startsWith("fanclub_");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      // Track registration started
      trackRegistrationStarted(nextParam || 'direct', checkoutParam);
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
        
        // Priority 1: stored intent (set by CTAs before redirect)
        const storedIntent = getStoredAuthIntent();
        if (storedIntent) {
          console.log("REGISTER_INTENT_FOUND", storedIntent);
          const redirectUrl = buildRedirectUrl(storedIntent);
          window.location.href = redirectUrl;
          return;
        }
        
        // Priority 2: ?checkout= param (fanclub checkout intent)
        if (checkoutParam) {
          // Build fanclub checkout URL with plan
          const fanclubUrl = `/fanclub?checkout=${checkoutParam}`;
          console.log("REGISTER_CHECKOUT_INTENT", fanclubUrl);
          window.location.href = fanclubUrl;
          return;
        }
        
        // Priority 3: ?next= or ?from_url= URL param
        if (nextParam) {
          const validated = validateRedirectUrl(nextParam);
          if (validated && validated !== '/') {
            window.location.href = validated;
            return;
          }
        }
      }
      // Fallback to client dashboard
      window.location.href = "/client/dashboard";
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({
        title: "Code sent",
        description: "Check your email for the new code.",
      });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleGoogle = () => {
    // Priority 1: stored intent
    const storedIntent = getStoredAuthIntent();
    if (storedIntent) {
      const redirectUrl = buildRedirectUrl(storedIntent);
      console.log("GOOGLE_REGISTER_INTENT", redirectUrl);
      base44.auth.loginWithProvider("google", redirectUrl);
      return;
    }
    // Priority 2: ?checkout= param (fanclub checkout intent)
    if (checkoutParam) {
      const fanclubUrl = `/fanclub?checkout=${checkoutParam}`;
      console.log("GOOGLE_CHECKOUT_INTENT", fanclubUrl);
      base44.auth.loginWithProvider("google", fanclubUrl);
      return;
    }
    // Priority 3: ?next= param
    if (nextParam) {
      base44.auth.loginWithProvider("google", nextParam);
      return;
    }
    // Fallback
    base44.auth.loginWithProvider("google", "/client/dashboard");
  };

  if (showOtp) {
    return (
      <>
        {noIndexMeta}
        <AuthLayout
        icon={Mail}
        title="Verify your email"
        subtitle={`We sent a code to ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the code?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            Resend
          </button>
        </p>
      </AuthLayout>
      </>
    );
  }

  return (
    <>
      {noIndexMeta}
      <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle={isFanProductionFlow ? "Create your FLESHLAB account to continue your Fan Production Request." : "Sign up to get started"}
      footer={
        <>
          Already have an account?{" "}
          <Link to={`/login${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`} className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isFanclubCheckout && (
          <div className="p-3 rounded-lg bg-rose-600/10 border border-rose-600/20 text-rose-300 text-sm">
            <strong>Continue Fanclub Checkout</strong> — Create your account to join Fanclub for $20.99/month.
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
    </>
  );
}