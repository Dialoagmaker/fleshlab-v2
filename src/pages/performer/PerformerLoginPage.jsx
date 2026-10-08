import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function PerformerLoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Get redirect destination from URL parameter
  const fromParam = new URLSearchParams(window.location.search).get("from") || "/performer/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // Call performer login backend function
      const res = await base44.functions.invoke("performerLogin", { 
        identifier, 
        password 
      });
      
      const data = res.data;
      
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      if (!data.success) {
        setError("Invalid performer username or password.");
        setLoading(false);
        return;
      }

      // Store performer session token
      localStorage.setItem("performer_session_token", data.token);
      localStorage.setItem("performer_data", JSON.stringify(data.performer));
      
      // Force reload to ensure auth state is picked up
      window.location.href = fromParam;
      
    } catch (err) {
      console.error("Performer login error:", err);
      setError("Invalid performer username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={KeyRound}
      title="Performer Login"
      subtitle="Access your FLESHLAB performer dashboard."
      footer={
        <div className="space-y-3">
          <div className="text-center">
            <Link 
              to="/forgot-password" 
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="text-center border-t border-border pt-3">
            <Link 
              to="/" 
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Back to FLESHLAB
            </Link>
          </div>
        </div>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="identifier">Username or Stage Name</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="identifier"
              type="text"
              autoComplete="username"
              autoFocus
              placeholder="Your username or stage name"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-12"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in as Performer"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}