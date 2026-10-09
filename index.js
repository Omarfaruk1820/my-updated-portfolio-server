import "dotenv/config";

import express from "express";
import cors from "cors";

import { connectToMongoDB } from "./config/db.js";

import projectRoutes from "./routes/project.routes.js";
import skillRoutes from "./routes/skill.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import experienceRoutes from "./routes/experience.routes.js";
import educationRoutes from "./routes/education.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.disable("x-powered-by");

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  process.env.CLIENT_URL_PROD || "https://omar-faruk-portfolio-9a43d.web.app",
  "https://omar-faruk-portfolio-9a43d.firebaseapp.com",
]
  .flatMap((origin) => origin.split(","))
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header, such as server-to-server calls.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Health check: does not require a database connection.
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Portfolio server is running successfully!",
  });
});

// Cache the connection promise across requests in the same server instance.
let dbConnectionPromise;

const ensureDatabaseConnection = async (req, res, next) => {
  try {
    if (!dbConnectionPromise) {
      dbConnectionPromise = connectToMongoDB().catch((error) => {
        // Allow a later request to retry after a failed connection.
        dbConnectionPromise = null;
        throw error;
      });
    }

    await dbConnectionPromise;
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);

    res.status(503).json({
      success: false,
      message: "Database temporarily unavailable",
    });
  }
};

// All API endpoints require MongoDB.
app.use("/api", ensureDatabaseConnection);

app.use("/api/projects", projectRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/experiences", experienceRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/auth", authRoutes);

// 404 handler.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler.
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error("Request error:", err);

  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Internal server error"
        : err.message || "Request failed",
  });
});

export default app;
