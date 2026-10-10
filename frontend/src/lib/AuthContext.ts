import { createContext } from "react";
import type { SessionUser } from "@/types";

export interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  register: (body: Record<string, unknown>) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
