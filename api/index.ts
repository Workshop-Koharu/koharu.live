import express, { Request, Response, NextFunction } from "express";
import { apiRouter } from "../server/apiRoutes";

const app = express();

// Increase JSON body limit
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─────────────────────────────────────────────────────────────────────────────
// 1. Strict Security Headers & Origin Whitelisting (100점 만점 / A+ 등급)
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://www.koharu.live",
  "https://koharu.live",
  "http://localhost:5000",
  "http://localhost:3000",
  "http://127.0.0.1:5000",
];

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), vr=(), accelerometer=(), gyroscope=()"
  );
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; media-src 'self' data: https: blob:; connect-src 'self' https://discord.com https://*.neon.tech https://accounts.google.com https://*.googleapis.com wss: https:; frame-src 'self' https://accounts.google.com https://discord.com; base-uri 'self'; form-action 'self';"
  );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");

  // Strict CORS: No wildcard allowed! Only trusted whitelist
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "https://www.koharu.live");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

// Middleware to normalize req.url for Vercel serverless environment
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.query?.all) {
    const subpath = Array.isArray(req.query.all)
      ? req.query.all.join("/")
      : String(req.query.all);
    if (subpath && !req.url.includes(subpath)) {
      req.url = `/${subpath}`;
    }
  }
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Discord Component v2 Data Model (Zero AI Fluff, Clean Professional Tone)
// ─────────────────────────────────────────────────────────────────────────────
interface DiscordComponentData {
  title: string;
  description: string;
  accentColor: number;
  thumbnailUrl: string;
  buttons: Array<{ label: string; url: string }>;
}

function getDiscordComponentDataForPath(pathStr: string): DiscordComponentData {
  const p = pathStr.toLowerCase();

  if (p.startsWith("/blog")) {
    return {
      title: "코하루 개발 블로그",
      description: "언리얼 엔진 5 · Unity · C++ · C# 게임플레이 아키텍처 및 개발 일지",
      accentColor: 0x5865f2,
      thumbnailUrl: "https://www.koharu.live/favicon.png",
      buttons: [
        { label: "블로그 최신 글 읽기", url: "https://www.koharu.live/blog" },
        { label: "메인 포트폴리오", url: "https://www.koharu.live/" },
      ],
    };
  }

  if (p.startsWith("/moments") || p.startsWith("/instagram") || p.startsWith("/post")) {
    return {
      title: "코하루 모먼트",
      description: "일상 사진과 개발 진척 소식을 공유하는 모먼트 피드",
      accentColor: 0x38bdf8,
      thumbnailUrl: "https://www.koharu.live/favicon.png",
      buttons: [
        { label: "모먼트 피드 열기", url: "https://www.koharu.live/moments" },
        { label: "메인 포트폴리오", url: "https://www.koharu.live/" },
      ],
    };
  }

  if (p.startsWith("/projects") || p.startsWith("/project")) {
    return {
      title: "코하루 프로젝트 쇼케이스",
      description: "Workshop-Koharu (Mirae AI 생성형 AI) · Team Light (보안 봇 서린, AI 봇 아린, 알림 봇 다모아) · NOCTIL Studio (서브컬쳐 오픈월드 게임)",
      accentColor: 0x2563eb,
      thumbnailUrl: "https://www.koharu.live/favicon.png",
      buttons: [
        { label: "프로젝트 둘러보기", url: "https://www.koharu.live/projects" },
        { label: "Team Light 바로가기", url: "https://teamlight.pe.kr/" },
      ],
    };
  }

  if (p.startsWith("/history")) {
    return {
      title: "개발 히스토리 & 마일스톤",
      description: "코하루의 개발 발자취와 주요 마일스톤 기록",
      accentColor: 0x6366f1,
      thumbnailUrl: "https://www.koharu.live/favicon.png",
      buttons: [
        { label: "히스토리 보기", url: "https://www.koharu.live/history" },
        { label: "메인 포트폴리오", url: "https://www.koharu.live/" },
      ],
    };
  }

  if (p.startsWith("/letter")) {
    return {
      title: "코하루의 편지",
      description: "코하루가 전하는 메시지 공간",
      accentColor: 0xec4899,
      thumbnailUrl: "https://www.koharu.live/favicon.png",
      buttons: [
        { label: "편지함 열기", url: "https://www.koharu.live/letter" },
        { label: "메인 포트폴리오", url: "https://www.koharu.live/" },
      ],
    };
  }

  if (p.startsWith("/partners") || p.startsWith("/partner")) {
    return {
      title: "협업 파트너스",
      description: "Sua (intro-us.xyz), Team Light, Workshop-Koharu 등 소중한 협력 파트너",
      accentColor: 0x3b82f6,
      thumbnailUrl: "https://www.koharu.live/favicon.png",
      buttons: [
        { label: "파트너스 페이지", url: "https://www.koharu.live/partners" },
        { label: "디스코드 프로필", url: "https://discord.com/users/1339604814631534667" },
      ],
    };
  }

  if (p.startsWith("/person") || p.startsWith("/people")) {
    return {
      title: "지인 목록",
      description: "함께하는 소중한 인연들의 공간",
      accentColor: 0x06b6d4,
      thumbnailUrl: "https://www.koharu.live/favicon.png",
      buttons: [
        { label: "지인 목록 보기", url: "https://www.koharu.live/person" },
        { label: "메인 포트폴리오", url: "https://www.koharu.live/" },
      ],
    };
  }

  if (p.startsWith("/shorten") || p.startsWith("/s")) {
    return {
      title: "URL 단축기",
      description: "웹 주소를 간결하게 줄여주는 단축 URL 서비스",
      accentColor: 0x2563eb,
      thumbnailUrl: "https://www.koharu.live/favicon.png",
      buttons: [
        { label: "단축기 열기", url: "https://www.koharu.live/shorten" },
        { label: "메인 포트폴리오", url: "https://www.koharu.live/" },
      ],
    };
  }

  // Default Home
  return {
    title: "! Koharu — 게임 클라이언트 프로그래머",
    description: "언리얼 엔진 5 & Unity 개발자 · Workshop-Koharu (Mirae AI 생성형 AI) · Team Light (보안 봇 서린, AI 채팅 봇 아린, 알림 봇 다모아) · NOCTIL Studio (서브컬쳐 오픈월드 게임)",
    accentColor: 0x2563eb,
    thumbnailUrl: "https://www.koharu.live/favicon.png",
    buttons: [
      { label: "포트폴리오 열기", url: "https://www.koharu.live/" },
      { label: "디스코드 프로필", url: "https://discord.com/users/1339604814631534667" },
    ],
  };
}

// Helper to construct exact Discord Component v2 JSON format
function buildDiscordComponentV2Payload(data: DiscordComponentData) {
  return {
    component: {
      type: 17, // Container
      accent_color: data.accentColor,
      components: [
        {
          type: 9, // Section with accessory thumbnail
          components: [
            {
              type: 10, // Text Display (Header & Body)
              content: `### ${data.title}\n${data.description}`,
            },
          ],
          accessory: {
            type: 11, // Media / Thumbnail
            media: {
              url: data.thumbnailUrl,
            },
          },
        },
        {
          type: 14, // Separator / Divider Component
          divider: true,
          spacing: 1,
        },
        {
          type: 1, // Action Row with Link Buttons
          components: data.buttons.map((btn) => ({
            type: 2, // Button
            style: 5, // Link Button (↗)
            label: btn.label,
            url: btn.url,
          })),
        },
      ],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Discord Component v2 JSON Endpoints
// ─────────────────────────────────────────────────────────────────────────────
app.get(["/api/discord/embed.json", "/.well-known/discord-component-embed.json"], (req: Request, res: Response) => {
  const reqUrl = (req.query.url as string) || (req.query.path as string) || "/";
  let pathname = "/";
  try {
    pathname = new URL(reqUrl, "https://www.koharu.live").pathname;
  } catch {
    pathname = reqUrl;
  }

  const data = getDiscordComponentDataForPath(pathname);
  const payload = buildDiscordComponentV2Payload(data);

  res.setHeader("Content-Type", "application/vnd.discord.component-embed+json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.json(payload);
});

// Standard oEmbed fallback
app.get("/api/oembed", (req: Request, res: Response) => {
  const url = (req.query.url as string) || "https://www.koharu.live";
  let pathname = "/";
  try {
    pathname = new URL(url, "https://www.koharu.live").pathname;
  } catch {
    pathname = url;
  }

  const data = getDiscordComponentDataForPath(pathname);

  res.json({
    version: "1.0",
    type: "link",
    title: data.title,
    author_name: "! Koharu",
    author_url: "https://www.koharu.live",
    provider_name: "koharu.live",
    provider_url: "https://www.koharu.live",
    description: data.description,
    thumbnail_url: data.thumbnailUrl,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Discord Bot Crawler SSR Metadata & Component v2 Interceptor
// ─────────────────────────────────────────────────────────────────────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  const ua = req.headers["user-agent"] || "";
  const isBot = /Discordbot|Twitterbot|facebookexternalhit|Slackbot|TelegramBot|kakaotalk-scrap/i.test(ua);

  // If not bot, or if it's an API request, proceed to normal handler
  if (!isBot || req.path.startsWith("/api") || req.path.startsWith("/.well-known")) {
    return next();
  }

  const pathname = req.path.toLowerCase();
  const data = getDiscordComponentDataForPath(pathname);
  const fullUrl = `https://www.koharu.live${req.path}`;
  const embedJsonUrl = `https://www.koharu.live/api/discord/embed.json?path=${encodeURIComponent(req.path)}`;
  const oembedUrl = `https://www.koharu.live/api/oembed?url=${encodeURIComponent(fullUrl)}`;

  const v2Payload = buildDiscordComponentV2Payload(data);
  const hexColor = `#${data.accentColor.toString(16).padStart(6, "0")}`;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <meta name="description" content="${data.description}">
  <meta name="theme-color" content="${hexColor}">

  <!-- Discord Component v2 Official Embed -->
  <link rel="discord:component-embed" type="application/vnd.discord.component-embed+json" href="${embedJsonUrl}">
  <script id="discord:component-embed" type="application/json">
${JSON.stringify(v2Payload)}
  </script>

  <!-- OpenGraph Metadata -->
  <meta property="og:site_name" content="koharu.live">
  <meta property="og:title" content="${data.title}">
  <meta property="og:description" content="${data.description}">
  <meta property="og:url" content="${fullUrl}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${data.thumbnailUrl}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${data.title}">
  <meta name="twitter:description" content="${data.description}">
  <meta name="twitter:image" content="${data.thumbnailUrl}">

  <!-- Discord oEmbed Fallback Link -->
  <link rel="alternate" type="application/json+oembed" href="${oembedUrl}" title="! Koharu Embed">
</head>
<body>
  <h1>${data.title}</h1>
  <p>${data.description}</p>
  <p><a href="${fullUrl}">페이지로 이동</a></p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(html);
});

// Root API health check
app.get(["/api", "/api/"], (_req: Request, res: Response) => {
  res.json({ status: "ok", name: "koharu-api", version: "2.3.0" });
});

// Mount router on both "/api" and "/"
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Serverless API Error]:", err);
  res.status(500).json({ error: err?.message || "Internal Server Error" });
});

export default app;
