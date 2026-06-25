import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppSelector";
import { LoadingState } from "@/components/shared/LoadingState";
import {
  canAccessPath,
  getUnauthorizedRedirectTarget,
} from "@/lib/rbac";

export function AuthorizedOutlet() {
  const location = useLocation();
  const { role, roleStatus } = useAppSelector((s) => s.auth);
  const path = location.pathname;

  if (roleStatus === "loading" || roleStatus === "idle") {
    return <LoadingState />;
  }

  if (roleStatus === "missing") {
    if (canAccessPath(null, "missing", path)) return <Outlet />;
    return <Navigate to="/" replace />;
  }

  if (roleStatus === "ready" && role) {
    if (!canAccessPath(role, "ready", path)) {
      return (
        <Navigate
          to={getUnauthorizedRedirectTarget(role, "ready")}
          replace
        />
      );
    }
  } else if (roleStatus === "ready") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
