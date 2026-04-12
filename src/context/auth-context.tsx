import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  avatar: string;
  streak?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: "student" | "teacher") => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndSetUser = async () => {
    const profile = await api.get<{ id: string; name: string; email: string; role: "student" | "teacher" | "admin"; avatar: string; streak?: number }>("/auth/me");
    const userData: User = { id: profile.id, name: profile.name, email: profile.email, role: profile.role, avatar: profile.avatar || "", streak: profile.streak ?? 0 };
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
      fetchAndSetUser()
        .catch(() => {
          // Token expired or invalid — clear and let user re-login naturally
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ accessToken: string; refreshToken: string }>("/auth/login", { email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    await fetchAndSetUser();
  };

  const register = async (name: string, email: string, password: string, role: "student" | "teacher") => {
    await api.post("/auth/register", { name, email, password, role });
    await login(email, password);
  };

  const googleLogin = async (credential: string) => {
    const data = await api.post<{ accessToken: string; refreshToken: string }>("/auth/google", { credential });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    await fetchAndSetUser();
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = (updated: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...updated };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, googleLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
