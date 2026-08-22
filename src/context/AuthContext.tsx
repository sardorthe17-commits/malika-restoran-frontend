"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import type { User, ApiResponse } from "@/lib/types";

interface RegisterInput {
  fullName: string;
  age: number;
  phone: string;
  password: string;
  telegramId?: string;
  otp_code: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<ApiResponse>;
  register: (input: RegisterInput) => Promise<ApiResponse>;
  sendOtp: (phone: string) => Promise<ApiResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<User>>("/me");
      setUser(res.data ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const login = useCallback(
    async (phone: string, password: string) => {
      const res = await api.post<ApiResponse<User>>("/sign-in", { phone, password });
      if (res.success) {
        setUser(res.data ?? null);
      }
      return res;
    },
    []
  );

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api.post<ApiResponse>("/sign-up", input);
    if (res.success) {
      await refresh();
    }
    return res;
  }, [refresh]);

  const sendOtp = useCallback(async (phone: string) => {
    return await api.post<ApiResponse>("/send-otp", { phone });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/logout");
    } catch {
      // baribir lokal holatni tozalaymiz
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, sendOtp, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}

export { ApiError };
