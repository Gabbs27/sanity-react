
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";

/**
 * ProtectedDashboard - Wrapper para proteger el dashboard real
 * Redirige a login si no está autenticado
 */

import { type ReactNode } from "react";

const ProtectedDashboard = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

export default ProtectedDashboard;



