import { useEffect, useState } from "react";
import { Outlet, Navigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function AdminGuard() {
  const [state, setState] = useState("loading"); // "loading" | "admin" | "denied"

  useEffect(() => {
    base44.auth.me()
      .then(user => {
        console.log("ADMIN_GUARD_USER", user); // Debug log for admin role field
        setState(user?.role === "admin" ? "admin" : "denied");
      })
      .catch(() => setState("denied"));
  }, []);

  if (state === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to access the admin area.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/account">My Account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}