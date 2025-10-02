import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("patient" | "clinician" | "admin")[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (allowedRoles && userRole && !allowedRoles.includes(userRole.role)) {
        navigate("/dashboard");
      }
    }
  }, [user, userRole, loading, allowedRoles, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (allowedRoles && userRole && !allowedRoles.includes(userRole.role))) {
    return null;
  }

  return <>{children}</>;
};