const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1523139211228741784";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "tUGuQO8qivi42N0HFKFPOOtV_kdRg3HR";

function checkIsAdmin(user: { email?: string | null; username?: string | null; global_name?: string | null; id?: string | null }): boolean {
  if (!user) return false;
  const idStr = String(user.id || "").trim();
  const emailStr = (user.email || "").trim().toLowerCase();
  const uname = (user.username || "").trim().toLowerCase();
  const gname = (user.global_name || "").trim().toLowerCase();

  // Primary check: Koharu's unique Discord snowflake ID
  if (idStr === "1339604814631534667") return true;

  // Secondary checks: verified admin email or explicit admin handles
  if (emailStr === "codingexpertleon@gmail.com") return true;
  if (
    uname.includes("sua_is.babo") ||
    gname.includes("sua_is.babo") ||
    uname.includes("koharu_81s") ||
    gname.includes("koharu_81s") ||
    uname.includes("koharu81")
  ) {
    return true;
  }

  return false;
}

export default async function handler(req: any, res: any) {
  // CORS & Security headers
  const origin = req.headers?.origin || "https://www.koharu.live";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { code, redirectUri } = body;

    if (!code) {
      return res.status(400).json({ error: "Authorization code is required" });
    }

    const host = req.headers?.host || "koharu.live";
    const finalRedirect = redirectUri || (host.includes("localhost") ? `http://${host}/auth/discord/callback` : "https://koharu.live/auth/discord/callback");

    // 1. Exchange code for access token with Discord OAuth2 (with auto fallback)
    const tryExchange = async (rUri: string) => {
      const tokenParams = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: rUri,
      });
      return fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams,
      });
    };

    let tokenRes = await tryExchange(finalRedirect);
    if (!tokenRes.ok && finalRedirect.includes("www.koharu.live")) {
      tokenRes = await tryExchange("https://koharu.live/auth/discord/callback");
    } else if (!tokenRes.ok && !finalRedirect.includes("www.") && finalRedirect.includes("koharu.live")) {
      tokenRes = await tryExchange("https://www.koharu.live/auth/discord/callback");
    }

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[Discord OAuth API] Token exchange error:", errText);
      return res.status(400).json({
        error: "Failed to exchange Discord authorization code",
        details: errText,
      });
    }

    const tokenData = (await tokenRes.json()) as { access_token: string; token_type: string };

    // 2. Fetch user profile from Discord
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return res.status(400).json({ error: "Failed to fetch Discord user information" });
    }

    const discordUser = (await userRes.json()) as {
      id: string;
      username: string;
      global_name?: string | null;
      email?: string | null;
      avatar?: string | null;
    };

    // 3. Admin validation
    const isAdmin = checkIsAdmin(discordUser);
    const role = isAdmin ? "admin" : "user";
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : "/assets/koharu-profile.png";

    return res.status(200).json({
      success: true,
      user: {
        id: discordUser.id,
        openId: `discord:${discordUser.id}`,
        username: discordUser.username,
        name: discordUser.global_name || discordUser.username,
        email: discordUser.email,
        avatar: avatarUrl,
        role,
        isAdmin,
        provider: "discord",
      },
    });
  } catch (err: any) {
    console.error("[Discord OAuth API] Internal Server Error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err?.message || String(err),
    });
  }
}

