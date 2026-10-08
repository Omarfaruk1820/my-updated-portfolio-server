import "dotenv/config";

import express from "express";
import cors from "cors";

import { connectToMongoDB, disconnectFromMongoDB } from "./config/db.js";

import projectRoutes from "./routes/project.routes.js";
import skillRoutes from "./routes/skill.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import experienceRoutes from "./routes/experience.routes.js";
import educationRoutes from "./routes/education.routes.js";
// import testimonialRoutes from "./routes/testimonial.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

/* =========================================================
   ENVIRONMENT CONFIGURATION
========================================================= */

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

/* =========================================================
   APP CONFIGURATION
========================================================= */

app.disable("x-powered-by");

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

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
   API ROUTES
========================================================= */

app.use("/api/projects", projectRoutes);

app.use("/api/skills", skillRoutes);

app.use("/api/services", serviceRoutes);

app.use("/api/experiences", experienceRoutes);

app.use("/api/education", educationRoutes);

// app.use("/api/testimonials", testimonialRoutes);

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
  console.error("❌ Server Error:", err);

  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : err.message || "Request failed",
  });
});

/* =========================================================
   START SERVER
========================================================= */

const startServer = async () => {
  try {
    await connectToMongoDB();

    const server = app.listen(PORT, () => {
      console.log("========================================");
      console.log("🚀 Portfolio server started successfully");
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌐 Local: http://localhost:${PORT}`);
      console.log(`🔗 Client: ${CLIENT_URL}`);
      console.log("========================================");
    });

    /* =====================================================
       GRACEFUL SHUTDOWN
    ===================================================== */

    let isShuttingDown = false;

    const shutdown = async (signal) => {
      if (isShuttingDown) {
        return;
      }

      isShuttingDown = true;

      console.log(`\n⚠️ ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        try {
          await disconnectFromMongoDB();

          console.log("✅ MongoDB connection closed");
          console.log("✅ Server closed successfully");

          process.exit(0);
        } catch (error) {
          console.error("❌ Error during shutdown:", error);

          process.exit(1);
        }
      });

      // Force shutdown if server does not close in time.
      setTimeout(() => {
        console.error("❌ Forced shutdown: server did not close in time.");

        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("SIGTERM", () => shutdown("SIGTERM"));

    /* =====================================================
       PROCESS ERROR HANDLING
    ===================================================== */

    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);

      shutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason) => {
      console.error("❌ Unhandled Promise Rejection:", reason);

      shutdown("unhandledRejection");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);

    try {
      await disconnectFromMongoDB();
    } catch (shutdownError) {
      console.error("❌ Failed to close MongoDB connection:", shutdownError);
    }

    process.exit(1);
  }
};

startServer();
