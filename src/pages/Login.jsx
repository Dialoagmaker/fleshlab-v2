import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { getStoredAuthIntent, buildRedirectUrl, validateRedirectUrl } from "@/lib/authRedirect";
import { safeReturnTo } from "@/lib/authReturnTo";
import { trackLoginSuccess, trackLoginFailed, setAnalyticsUserId } from "@/lib/analytics";

import SEOMeta from "@/components/SEOMeta";

export default function Login() {
  const [email, setEmail] = useState("");
  
  // SEO: Prevent indexing of auth pages
  const noIndexMeta = (
    <SEOMeta
      title="Log In"
      description="Log in to your FLESHLAB account"
      canonical="/login"
      noIndex={true}
    />
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Read ?next= or ?from= or ?from_url= from URL (support all variants)
  const urlParams = new URLSearchParams(window.location.search);
  const returnToParam = safeReturnTo();
  const fromParam = urlParams.get("next") || urlParams.get("from_url") || urlParams.get("from") || (returnToParam !== "/" ? returnToParam : null);
  const isFanProductionFlow = fromParam && fromParam.includes("/fan-productions");

  const getRedirectForRole = (user) => {
    const role = user?.role;
    const hasPerformerProfile = user?.performer_profile_id || user?.performer_id;
    
    console.log("GET_REDIRECT_FOR_ROLE", { role, hasPerformerProfile, fromParam });
    
    // Priority 1: Check stored auth intent (from monetization CTAs)
    const storedIntent = getStoredAuthIntent();
    if (storedIntent) {
      console.log("LOGIN_INTENT_FOUND", storedIntent);
      return buildRedirectUrl(storedIntent);
    }
    
    // Priority 2: URL next/from parameter (validated)
    if (fromParam) {
      const validated = validateRedirectUrl(fromParam);
      if (validated && validated !== '/') {
        // Admin route handling — don't send non-admins to admin
        if (validated.startsWith("/admin")) {
          return role === "admin" ? "/admin/dashboard" : "/client/dashboard";
        }
        return validated;
      }
    }
    
    // Priority 3: Role-based defaults with proper precedence
    // 1. Admin
    if (role === "admin" || role === "super_admin") {
      console.log("ROLE_REDIRECT_ADMIN");
      return "/admin/dashboard";
    }
    
    // 2. Performer (by role OR linked profile)
    if (role === "performer" || hasPerformerProfile) {
      console.log("ROLE_REDIRECT_PERFORMER", { hasPerformerProfile });
      return "/performer/dashboard";
    }
    
    // 3. Client/Customer fallback
    console.log("ROLE_REDIRECT_CLIENT_FALLBACK");
    return "/client/dashboard";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Normalize email: trim whitespace + lowercase before login
      const normalizedEmail = email.trim().toLowerCase();
      setEmail(normalizedEmail);
      
      // Login and save token
      await base44.auth.loginViaEmailPassword(normalizedEmail, password);
      
      // Get user data to determine role
      const user = await base44.auth.me();
      console.log("LOGIN_SUCCESS", { role: user?.role, email: user?.email, performer_profile_id: user?.performer_profile_id, performer_id: user?.performer_id });

      // Record login activity (best-effort, never blocks login)
      try {
        await base44.auth.updateMe({
          last_login: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          login_count: (user?.login_count || 0) + 1,
        });
      } catch (_) {}
      setAnalyticsUserId(user?.id);
      trackLoginSuccess(user?.role);

      // If non-admin tried to access admin, show error
      if (fromParam && fromParam.startsWith("/admin") && user?.role !== "admin") {
        setError("Access denied: Admin access required");
        setLoading(false);
        return;
      }
      
      // Determine redirect URL based on full user object (role + linked entities)
      const redirectUrl = getRedirectForRole(user);
      console.log("LOGIN_REDIRECT", { redirectUrl });
      
      // Force reload to ensure AuthContext picks up the new token
      window.location.href = redirectUrl;
    } catch (err) {
      console.error("LOGIN_ERROR", err);
      trackLoginFailed(err.message || "invalid_credentials", email);
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    // Priority 1: Check stored auth intent
    const storedIntent = getStoredAuthIntent();
    if (storedIntent) {
      const redirectUrl = buildRedirectUrl(storedIntent);
      console.log("GOOGLE_LOGIN_INTENT", redirectUrl);
      base44.auth.loginWithProvider("google", redirectUrl);
      return;
    }
    
    // Priority 2: Use next/from param (validated)
    const redirectUrl = fromParam ? (validateRedirectUrl(fromParam) || "/client/dashboard") : "/client/dashboard";
    base44.auth.loginWithProvider("google", redirectUrl);
  };

  return (
    <>
      {noIndexMeta}
      <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle={isFanProductionFlow ? "Log in to continue your Fan Production Request." : "Log in to your account"}
      footer={
        <>
          Don't have an account?{" "}
          <Link to={`/register${fromParam ? `?next=${encodeURIComponent(fromParam)}` : ""}`} className="text-primary font-medium hover:underline">
            Create one
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </AuthLayout>
    </>
  );
}