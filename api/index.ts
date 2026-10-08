import express from "express";
import { apiRouter } from "../server/apiRoutes";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Register REST API routes
app.use("/api", apiRouter);

// Fallback for root api
app.get("/api", (req, res) => {
  res.json({ status: "ok", name: "koharu-api", version: "2.0.0" });
});

export default app;
