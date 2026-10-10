import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiErrorMessage, authApi, setAccessToken } from "@/lib/api";
import type { Role, SessionUser } from "@/types";
import { AuthContext } from "@/lib/AuthContext";

function readClaims(token: string): { userId: string; role: Role } {
  const payload = token.split(".")[1];
  if (!payload) throw new Error("The session token is malformed.");
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = JSON.parse(atob(base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), "="))) as {
    userId?: string;
    role?: Role;
  };
  if (!decoded.userId || !["PATIENT", "DOCTOR", "ADMIN"].includes(decoded.role ?? "")) {
    throw new Error("The session token is missing a valid user identity.");
  }
  return { userId: decoded.userId, role: decoded.role as Role };
}

function notify(message: string) {
  window.dispatchEvent(new CustomEvent("clinic:notice", { detail: { message, kind: "error" } }));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const acceptSession = useCallback((nextUser: SessionUser, token: string) => {
    queryClient.clear();
    setAccessToken(token);
    setUser(nextUser);
    return nextUser;
  }, [queryClient]);

  const expireSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    const onExpired = () => expireSession();
    window.addEventListener("clinic:session-expired", onExpired);
    void authApi.refresh()
      .then(async (token) => {
        const claims = readClaims(token);
        const restored: SessionUser = { id: claims.userId, role: claims.role };
        try {
          if (claims.role === "PATIENT") restored.patient = await authApi.patientProfile();
          if (claims.role === "DOCTOR") restored.doctor = await authApi.doctorProfile();
        } catch (error) {
          notify(`Session restored, but your profile could not be loaded: ${apiErrorMessage(error)}`);
        }
        setUser(restored);
      })
      .catch(() => setAccessToken(null))
      .finally(() => setLoading(false));
    return () => window.removeEventListener("clinic:session-expired", onExpired);
  }, [expireSession]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    return acceptSession(result.user, result.accessToken);
  }, [acceptSession]);

  const register = useCallback(async (body: Record<string, unknown>) => {
    const result = await authApi.register(body);
    return acceptSession(result.user, result.accessToken);
  }, [acceptSession]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      expireSession();
      throw new Error(apiErrorMessage(error), { cause: error });
    }
    expireSession();
  }, [expireSession]);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
