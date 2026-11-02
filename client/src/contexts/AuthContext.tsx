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
  loginWithGoogle: () => void;
  renderGoogleButton: (element: HTMLElement) => void;
  logout: () => void;
  isAdmin: boolean;
  isLoggedIn: boolean;
}

export const GOOGLE_CLIENT_ID = "472455062452-p21b2s1cicka565j7h8kuv59erij8p6r.apps.googleusercontent.com";
export const DISCORD_CLIENT_ID = "1523139211228741784";

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithDiscord: () => {},
  loginWithGoogle: () => {},
  renderGoogleButton: () => {},
  logout: () => {},
  isAdmin: false,
  isLoggedIn: false,
});

const STORAGE_KEY = "koharu_app_user_v2";

// Helper: Safely parse JWT from Google Credential response
function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT token", e);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const handleCredentialResponse = (response: any) => {
    if (!response || !response.credential) {
      toast.error("Google 인증 정보를 가져오지 못했습니다.");
      return;
    }

    const payload = parseJwt(response.credential);
    if (!payload || !payload.sub) {
      toast.error("Google 프로필 파싱에 실패했습니다.");
      return;
    }

    const newUser: AppUser = {
      id: payload.sub,
      openId: `google:${payload.sub}`,
      name: payload.name || payload.email?.split("@")[0] || "Google User",
      email: payload.email,
      avatar: payload.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(payload.name || "User")}`,
      provider: "google",
      role: "user",
      isAdmin: false,
    };

    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    toast.success(`Google 로그인 성공! 환영합니다, ${newUser.name}님 🌸`);

    // Sync to backend DB
    fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatar: newUser.avatar,
      }),
    }).catch(() => {});
  };

  // Initialize Google Identity Services
  useEffect(() => {
    const initGoogleGSI = () => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
          });
        } catch (e) {
          console.warn("Google GIS initialize error:", e);
        }
      }
    };

    if (typeof window !== "undefined") {
      if ((window as any).google?.accounts?.id) {
        initGoogleGSI();
      } else {
        const interval = setInterval(() => {
          if ((window as any).google?.accounts?.id) {
            initGoogleGSI();
            clearInterval(interval);
          }
        }, 300);
        return () => clearInterval(interval);
      }
    }
  }, []);

  // Load cached user session
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppUser;
        // Verify admin rules if discord
        if (parsed.provider === "discord") {
          const isEmailMatch = (parsed.email || "").toLowerCase() === "codingexpertleon@gmail.com";
          const uname = (parsed.username || "").toLowerCase();
          const pname = (parsed.name || "").toLowerCase();
          const isUserMatch =
            uname === "sua_is.babo" ||
            pname === "sua_is.babo" ||
            uname === "koharu_81s" ||
            pname === "koharu_81s";
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
    // If not localhost, force www.koharu.live
    let redirectUri = `${window.location.origin}/auth/discord/callback`;
    if (!window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")) {
      redirectUri = "https://www.koharu.live/auth/discord/callback";
    }

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=identify%20email`;

    sessionStorage.setItem("auth_return_url", window.location.pathname + window.location.search);
    window.location.href = discordAuthUrl;
  };

  const loginWithGoogle = () => {
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log("One-tap dismissed or skipped, opening credential popup if available");
          }
        });
      } catch (err) {
        console.error("Google prompt error:", err);
      }
    } else {
      toast.error("Google 로그인 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const renderGoogleButton = (element: HTMLElement) => {
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id && element) {
      try {
        (window as any).google.accounts.id.renderButton(element, {
          theme: "filled_blue",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: 280,
        });
      } catch (err) {
        console.warn("renderButton error:", err);
      }
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
        renderGoogleButton,
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
