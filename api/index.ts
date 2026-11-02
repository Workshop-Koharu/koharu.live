import express, { Request, Response, NextFunction } from "express";
import { apiRouter } from "../server/apiRoutes";

const app = express();

// Increase JSON body limit
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─────────────────────────────────────────────────────────────────────────────
// 1. Bank-Grade Security Headers (100점 A+ 웹 보안)
// ─────────────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
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
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
// 2. Discord Component v2 oEmbed Endpoint
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/oembed", (req: Request, res: Response) => {
  const url = (req.query.url as string) || "https://koharu.live";
  const cleanUrl = url.toLowerCase();

  let title = "! Koharu (코하루) · Personal Portfolio 🌸";
  let description = "코드로 세상을 플레이어블하게 만드는 중 ✨ Unity, Shader, Web 게임 프로그래머";

  if (cleanUrl.includes("moment") || cleanUrl.includes("instagram")) {
    title = "코하루 모먼트 (Koharu Moments) 📸";
    description = "코하루의 일상과 개발 사진, 소중한 순간들을 기록하는 감성 갤러리 피드";
  } else if (cleanUrl.includes("blog")) {
    title = "코하루 개발 블로그 (Tech & Devlog) 📝";
    description = "Unity C#, HLSL Shader, 경량 엔진과 인디 게임 개발 일지를 기록하는 전용 마크다운 블로그";
  } else if (cleanUrl.includes("project")) {
    title = "코하루 프로젝트 쇼케이스 🎮";
    description = "Unity 게임, 커스텀 엔진 도구, 웹 기술 작업물 둘러보기";
  } else if (cleanUrl.includes("history")) {
    title = "코하루 개발 히스토리 & 타임라인 📅";
    description = "2024년부터 이어져 온 개발 발자취와 마일스톤 타임라인";
  } else if (cleanUrl.includes("shorten")) {
    title = "koharu.live URL 단축기 🔗";
    description = "길고 복잡한 웹 링크를 깔끔한 koharu.live 단축 링크로 줄여보세요!";
  } else if (cleanUrl.includes("letter")) {
    title = "코하루의 비밀 편지 💌";
    description = "패스코드를 입력하면 열리는 코하루의 비밀 편지 공간";
  } else if (cleanUrl.includes("partner")) {
    title = "코하루 파트너 & 협업 🤝";
    description = "수아, Team Light 등 소중한 파트너들을 소개합니다.";
  } else if (cleanUrl.includes("person") || cleanUrl.includes("people")) {
    title = "코하루 지인 목록 💖";
    description = "수아, 코블 등 소중한 인연들을 소개합니다.";
  }

  res.json({
    version: "1.0",
    type: "link",
    title,
    author_name: "! Koharu · 코하루 🌸",
    author_url: "https://koharu.live",
    provider_name: "koharu.live · Personal Portfolio",
    provider_url: "https://koharu.live",
    description,
    thumbnail_url: "https://koharu.live/assets/koharu-profile.png",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Discord Bot Crawler SSR Metadata Interceptor
// ─────────────────────────────────────────────────────────────────────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  const ua = req.headers["user-agent"] || "";
  const isBot = /Discordbot|Twitterbot|facebookexternalhit|Slackbot|TelegramBot|kakaotalk-scrap/i.test(ua);

  // If not bot, or if it's an API request, proceed to normal handler
  if (!isBot || req.path.startsWith("/api")) {
    return next();
  }

  const p = req.path.toLowerCase();
  let title = "! Koharu (코하루) · Personal Portfolio 🌸";
  let description = "코드로 세상을 플레이어블하게 만드는 중 ✨ Unity, Shader, Web, 게임 프로그래밍 포트폴리오";
  let color = "#f2689c";
  let image = "https://koharu.live/assets/koharu-atmosphere.webp";

  if (p.startsWith("/moments") || p.startsWith("/instagram") || p.startsWith("/post")) {
    title = "코하루 모먼트 (Koharu Moments) 📸";
    description = "코하루의 일상과 개발 사진, 소중한 순간들을 기록하는 감성 갤러리 피드";
    color = "#f2689c";
    image = "https://koharu.live/assets/koharu-profile.png";
  } else if (p.startsWith("/blog")) {
    title = "코하루 개발 블로그 (Tech & Devlog) 📝";
    description = "Unity C#, HLSL Shader, 엔진 도구와 인디 게임 개발 일지를 기록하는 전용 마크다운 블로그";
    color = "#8b5cf6";
    image = "https://koharu.live/assets/koharu-atmosphere.webp";
  } else if (p.startsWith("/projects") || p.startsWith("/project")) {
    title = "코하루 프로젝트 쇼케이스 🎮";
    description = "Unity 게임 개발, 커스텀 엔진 도구, 셰이더 및 웹 기술 프로젝트 작업물 둘러보기";
    color = "#ec4899";
    image = "https://koharu.live/assets/koharu-atmosphere.webp";
  } else if (p.startsWith("/history")) {
    title = "코하루 개발 히스토리 & 타임라인 📅";
    description = "2024년부터 이어져 온 개발 발자취와 마일스톤 타임라인";
    color = "#a855f7";
    image = "https://koharu.live/assets/koharu-profile.png";
  } else if (p.startsWith("/shorten") || p.startsWith("/s")) {
    title = "koharu.live URL 단축기 🔗";
    description = "길고 복잡한 웹 링크를 깔끔한 koharu.live/{코드} 단축 링크로 줄여보세요!";
    color = "#f43f5e";
    image = "https://koharu.live/assets/favicon.png";
  } else if (p.startsWith("/letter")) {
    title = "코하루의 비밀 편지 💌";
    description = "패스코드를 입력하면 열리는 코하루의 비밀 편지 공간";
    color = "#f472b6";
    image = "https://koharu.live/assets/koharu-profile.png";
  } else if (p.startsWith("/partners") || p.startsWith("/partner")) {
    title = "코하루 파트너 & 협업 🤝";
    description = "수아, Team Light 등 소중한 파트너들을 소개합니다.";
    color = "#c084fc";
    image = "https://koharu.live/assets/koharu-profile.png";
  } else if (p.startsWith("/person") || p.startsWith("/people")) {
    title = "코하루 지인 목록 💖";
    description = "수아, 코블 등 소중한 인연들을 소개합니다.";
    color = "#38bdf8";
    image = "https://koharu.live/assets/koharu-profile.png";
  }

  const fullUrl = `https://koharu.live${req.path}`;
  const oembedUrl = `https://koharu.live/api/oembed?url=${encodeURIComponent(fullUrl)}`;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="theme-color" content="${color}">
  
  <!-- OpenGraph Discord Component v2 -->
  <meta property="og:site_name" content="koharu.live">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${fullUrl}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">

  <!-- Discord oEmbed Link -->
  <link rel="alternate" type="application/json+oembed" href="${oembedUrl}" title="! Koharu Embed">
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <a href="${fullUrl}">페이지로 이동</a>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(html);
});

// Root API health check
app.get(["/api", "/api/"], (_req: Request, res: Response) => {
  res.json({ status: "ok", name: "koharu-api", version: "2.1.0" });
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
