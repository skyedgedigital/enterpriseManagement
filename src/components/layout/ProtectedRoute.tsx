import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppSelector";
import { LoadingState } from "@/components/shared/LoadingState";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, initialized } = useAppSelector((state) => state.auth);

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingState />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
