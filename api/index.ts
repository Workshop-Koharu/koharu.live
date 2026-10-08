import express, { Request, Response, NextFunction } from "express";
import { apiRouter } from "../server/apiRoutes";

const app = express();

// Enable JSON and URL-encoded body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Enable basic CORS and JSON header
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Health check / root info
app.get("/api", (req: Request, res: Response) => {
  res.json({ status: "ok", name: "koharu-api", version: "2.0.0" });
});

// Mount routes on both "/api" and "/" so that both /api/profile and rewritten /profile work seamlessly
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[Serverless API Error]:", err);
  res.status(500).json({ error: err?.message || "Internal Server Error" });
});

export default app;
