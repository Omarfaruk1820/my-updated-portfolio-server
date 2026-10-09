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

/* =========================================================
   APPLICATION CONFIGURATION
========================================================= */

app.disable("x-powered-by");

const PORT = Number(process.env.PORT) || 5000;

const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, "");

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_PROD,
  "https://omar-faruk-portfolio-9a43d.web.app",
  "https://omar-faruk-portfolio-9a43d.firebaseapp.com",
]
  .filter(Boolean)
  .flatMap((origin) => origin.split(","))
  .map(normalizeOrigin)
  .filter(Boolean);

/* =========================================================
   CORS MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin(origin, callback) {
      // Requests without Origin, such as server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = normalizeOrigin(origin);

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      const error = new Error("Origin not allowed by CORS");
      error.status = 403;

      return callback(error);
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],

    optionsSuccessStatus: 204,
  }),
);

/* =========================================================
   BODY PARSING
========================================================= */

app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Portfolio server is running successfully!",
  });
});

/* =========================================================
   DATABASE CONNECTION MIDDLEWARE
========================================================= */

// Reuse the connection promise within the same server instance.
let dbConnectionPromise = null;

const ensureDatabaseConnection = async (req, res, next) => {
  try {
    if (!dbConnectionPromise) {
      dbConnectionPromise = connectToMongoDB().catch((error) => {
        // Permit another request to retry after connection failure.
        dbConnectionPromise = null;
        throw error;
      });
    }

    await dbConnectionPromise;

    return next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);

    return res.status(503).json({
      success: false,
      message: "Database temporarily unavailable",
    });
  }
};

/* =========================================================
   API ROUTES
========================================================= */

app.use("/api", ensureDatabaseConnection);

app.use("/api/projects", projectRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/experiences", experienceRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/auth", authRoutes);

/* =========================================================
   404 HANDLER
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // Invalid JSON submitted to express.json().
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
  }

  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  console.error("Request error:", err);

  const statusCode =
    Number.isInteger(err.status) && err.status >= 400 && err.status <= 599
      ? err.status
      : Number.isInteger(err.statusCode) &&
          err.statusCode >= 400 &&
          err.statusCode <= 599
        ? err.statusCode
        : 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Internal server error"
        : err.message || "Request failed",
  });
});

/* =========================================================
   LOCAL DEVELOPMENT SERVER
========================================================= */

// Vercel uses the exported Express app.
// Listen locally only when this file is executed directly.
if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log("========================================");
    console.log("Portfolio server started successfully");
    console.log(`Local: http://localhost:${PORT}`);
    console.log("========================================");
  });
}

export default app;
