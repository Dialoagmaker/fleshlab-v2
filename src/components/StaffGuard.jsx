import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const STAFF_ROLES = ["admin", "super_admin", "manager", "staff", "employee"];

export default function StaffGuard() {
  const [state, setState] = useState("loading");

  useEffect(() => {
    base44.auth.me()
      .then((user) => setState(STAFF_ROLES.includes(user?.role) ? "allowed" : "denied"))
      .catch(() => setState("denied"));
  }, []);

  if (state === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (state === "denied") {
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
}