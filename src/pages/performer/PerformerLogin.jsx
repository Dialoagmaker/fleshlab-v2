import { Navigate } from "react-router-dom";

export default function PerformerLogin() {
  // Legacy route - redirect to new performer login page
  return <Navigate to="/performer/login" replace />;
}