import express, { Request, Response, NextFunction } from "express";
import { apiRouter } from "../server/apiRoutes";

const app = express();

// Increase JSON body limit to 50MB for image data
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Enable CORS and headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Middleware to normalize req.url for Vercel serverless environment
app.use((req: Request, _res: Response, next: NextFunction) => {
  // If request arrived via catch-all query or rewrite
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

// Root API health check
app.get(["/api", "/api/"], (_req: Request, res: Response) => {
  res.json({ status: "ok", name: "koharu-api", version: "2.0.0" });
});

// Mount router on both "/api" and "/" so that both /api/profile and rewritten /profile match
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Serverless API Error]:", err);
  res.status(500).json({ error: err?.message || "Internal Server Error" });
});

export default app;
