import { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function AdminGuard() {
  const [state, setState] = useState("loading"); // "loading" | "admin" | "denied"

  useEffect(() => {
    base44.auth.me()
      .then(user => setState(user?.role === "admin" ? "admin" : "denied"))
      .catch(() => setState("denied"));
  }, []);

  if (state === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "denied") return <Navigate to="/account" replace />;

  return <Outlet />;
}