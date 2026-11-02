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
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://discord.com https://*.neon.tech https://accounts.google.com https://*.googleapis.com wss: https:; frame-src 'self' https://accounts.google.com https://discord.com; base-uri 'self'; form-action 'self';"
  );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");

  // Strict CORS: No wildcard allowed! Only trusted whitelist
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else if (!origin) {
    // Direct requests (like browser navigations or server-to-server)
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
// 2. Dynamic Discord Component v2 JSON Payload Generator
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
      description: "Unity C#, HLSL 셰이더 및 커스텀 렌더링 파이프라인 개발 일지. 아키텍처 분석과 게임 클라이언트 기술 아티클을 확인하세요.",
      accentColor: 0x5865f2, // Discord Blurple
      thumbnailUrl: "https://www.koharu.live/assets/koharu-profile.png",
      buttons: [
        { label: "블로그 글 목록", url: "https://www.koharu.live/blog" },
        { label: "메인 포트폴리오", url: "https://www.koharu.live/" },
      ],
    };
  }

  if (p.startsWith("/moments") || p.startsWith("/instagram") || p.startsWith("/post")) {
    return {
      title: "코하루 모먼트 피드",
      description: "실시간 개발 현황과 일상 모먼트를 기록하는 소셜 갤러리 피드입니다. 개발자 스토리와 사진을 확인해보세요.",
      accentColor: 0x38bdf8, // Sky Blue
      thumbnailUrl: "https://www.koharu.live/assets/koharu-profile.png",
      buttons: [
        { label: "모먼트 피드 열기", url: "https://www.koharu.live/moments" },
        { label: "메인 포트폴리오", url: "https://www.koharu.live/" },
      ],
    };
  }

  if (p.startsWith("/projects") || p.startsWith("/project")) {
    return {
      title: "코하루 프로젝트 쇼케이스",
      description: "Unity 6 셰이더 프레임워크, FSM 플레이어 컨트롤러 및 웹 플랫폼 등 주요 엔지니어링 프로젝트 아카이브입니다.",
      accentColor: 0x2563eb, // Rich Blue
      thumbnailUrl: "https://www.koharu.live/assets/koharu-profile.png",
      buttons: [
        { label: "프로젝트 갤러리", url: "https://www.koharu.live/projects" },
        { label: "GitHub 저장소", url: "https://github.com/Workshop-Koharu" },
      ],
    };
  }

  if (p.startsWith("/history")) {
    return {
      title: "코하루 개발 히스토리 & 타임라인",
      description: "2024년부터 이어져 온 게임 프로그래밍 발자취와 핵심 프로젝트 마일스톤을 타임라인으로 확인하세요.",
      accentColor: 0x6366f1, // Indigo
      thumbnailUrl: "https://www.koharu.live/assets/koharu-profile.png",
      buttons: [
        { label: "히스토리 타임라인", url: "https://www.koharu.live/history" },
        { label: "메인 포트폴리오", url: "https://www.koharu.live/" },
      ],
    };
  }

  if (p.startsWith("/partners") || p.startsWith("/partner")) {
    return {
      title: "코하루 협업 파트너스",
      description: "수아, Team Light 등 소중한 인연 및 인디 게임 개발 협력 파트너를 소개합니다.",
      accentColor: 0x3b82f6,
      thumbnailUrl: "https://www.koharu.live/assets/koharu-profile.png",
      buttons: [
        { label: "파트너 목록 보기", url: "https://www.koharu.live/partners" },
        { label: "이메일 협업 문의", url: "mailto:admin@koharu.live" },
      ],
    };
  }

  if (p.startsWith("/shorten") || p.startsWith("/s")) {
    return {
      title: "koharu.live URL 단축기",
      description: "복잡한 웹 주소를 안전하고 간결한 koharu.live 단축 링크로 생성하여 공유하세요.",
      accentColor: 0x2563eb,
      thumbnailUrl: "https://www.koharu.live/assets/koharu-profile.png",
      buttons: [
        { label: "단축기 열기", url: "https://www.koharu.live/shorten" },
        { label: "메인 포트폴리오", url: "https://www.koharu.live/" },
      ],
    };
  }

  // Default Home
  return {
    title: "! Koharu 게임 클라이언트 & 렌더링 엔지니어",
    description: "Unity URP Render Graph 기반 커스텀 셰이더 및 C# 게임플레이 아키텍처 포트폴리오. 대표 프로젝트 쇼케이스와 기술 블로그를 둘러보세요.",
    accentColor: 0x2563eb, // 1번 사진 NextUps 스타일 파란색
    thumbnailUrl: "https://www.koharu.live/assets/koharu-profile.png",
    buttons: [
      { label: "포트폴리오 열기", url: "https://www.koharu.live/" },
      { label: "기술 블로그 보기", url: "https://www.koharu.live/blog" },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Discord Component v2 JSON Endpoint (application/vnd.discord.component-embed+json)
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

  // Exact Discord Component v2 Structure matching Image 1
  const componentPayload = {
    type: 17, // Container
    accent_color: data.accentColor,
    components: [
      {
        type: 9, // Section
        components: [
          {
            type: 10, // Text Display
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
        type: 1, // Action Row
        components: data.buttons.map((btn) => ({
          type: 2, // Button
          style: 5, // Link Button (↗)
          label: btn.label,
          url: btn.url,
        })),
      },
    ],
  };

  res.setHeader("Content-Type", "application/vnd.discord.component-embed+json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.json(componentPayload);
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
    author_name: "! Koharu · 코하루",
    author_url: "https://www.koharu.live",
    provider_name: "koharu.live · Engineering Portfolio",
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

  // Embedded JSON payload string
  const componentJsonString = JSON.stringify({
    type: 17,
    accent_color: data.accentColor,
    components: [
      {
        type: 9,
        components: [
          {
            type: 10,
            content: `### ${data.title}\n${data.description}`,
          },
        ],
        accessory: {
          type: 11,
          media: {
            url: data.thumbnailUrl,
          },
        },
      },
      {
        type: 1,
        components: data.buttons.map((btn) => ({
          type: 2,
          style: 5,
          label: btn.label,
          url: btn.url,
        })),
      },
    ],
  });

  const hexColor = `#${data.accentColor.toString(16).padStart(6, "0")}`;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <meta name="description" content="${data.description}">
  <meta name="theme-color" content="${hexColor}">

  <!-- Discord Component v2 Official Embed Declarations -->
  <link rel="discord:component-embed" type="application/vnd.discord.component-embed+json" href="${embedJsonUrl}">
  <script id="discord:component-embed" type="application/json">
${componentJsonString}
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
  <p><a href="${fullUrl}">포트폴리오 페이지로 이동</a></p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(html);
});

// Root API health check
app.get(["/api", "/api/"], (_req: Request, res: Response) => {
  res.json({ status: "ok", name: "koharu-api", version: "2.2.0" });
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
