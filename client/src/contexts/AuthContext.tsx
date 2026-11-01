import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export interface AppUser {
  id: string;
  openId: string;
  name: string;
  username?: string;
  email?: string;
  avatar?: string;
  provider: "discord" | "google";
  role: "admin" | "user";
  isAdmin: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithDiscord: () => void;
  loginWithGoogle: (customData?: Partial<AppUser>) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithDiscord: () => {},
  loginWithGoogle: async () => false,
  logout: () => {},
  isAdmin: false,
  isLoggedIn: false,
});

const STORAGE_KEY = "koharu_app_user_v2";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load cached user session
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppUser;
        // Verify admin rules if discord
        if (parsed.provider === "discord") {
          const isEmailMatch = (parsed.email || "").toLowerCase() === "codingexpertleon@gmail.com";
          const isUserMatch =
            (parsed.username || "").toLowerCase() === "koharu_81s" ||
            (parsed.name || "").toLowerCase() === "koharu_81s";
          const isIdMatch = String(parsed.id) === "1339604814631534667";
          parsed.isAdmin = isEmailMatch && isUserMatch && isIdMatch;
          parsed.role = parsed.isAdmin ? "admin" : "user";
        }
        setUser(parsed);
      }
    } catch (e) {
      console.warn("Failed to parse stored user", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithDiscord = () => {
    const origin = window.location.origin;
    const redirectUri = `${origin}/auth/discord/callback`;
    const clientId = "1523139211228741784";
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=identify%20email`;

    // Save current url to return to after auth
    sessionStorage.setItem("auth_return_url", window.location.pathname + window.location.search);
    window.location.href = discordAuthUrl;
  };

  const loginWithGoogle = async (customData?: Partial<AppUser>): Promise<boolean> => {
    try {
      // If customData is supplied (e.g. from Google credential response or mock modal)
      if (customData && customData.email) {
        const id = customData.id || `google-${Date.now()}`;
        const newUser: AppUser = {
          id,
          openId: `google:${id}`,
          name: customData.name || customData.email.split("@")[0],
          email: customData.email,
          avatar: customData.avatar || "/assets/koharu-profile.png",
          provider: "google",
          role: "user",
          isAdmin: false,
        };

        setUser(newUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        toast.success(`Google 계정(${newUser.email})으로 로그인되었습니다! 🌸`);
        return true;
      }

      // Check if Google GIS is available or prompt user
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        // Fallback for user experience if Google Client ID is not yet placed into Vercel env
        return false;
      }

      return false;
    } catch (error) {
      console.error("Google sign in error", error);
      toast.error("Google 로그인 중 오류가 발생했습니다.");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("로그아웃 되었습니다.");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithDiscord,
        loginWithGoogle,
        logout,
        isAdmin: Boolean(user?.isAdmin),
        isLoggedIn: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAppAuth() {
  return useContext(AuthContext);
}
