import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute() {
  const { operator, loading } = useAuth();
  if (loading) return null;
  if (!operator) return <Navigate to="/login" replace />;
  return <Outlet />;
}
