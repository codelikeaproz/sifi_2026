import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

export function AdminRoute() {
  const { isAuthenticated, isAuthReady, canManageUsers } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!canManageUsers) {
    return <Navigate to="/admin/scholars" replace />;
  }

  return <Outlet />;
}
