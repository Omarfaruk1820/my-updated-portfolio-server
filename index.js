import express from "express";
import cors from "cors";

import { connectToMongoDB, disconnectFromMongoDB } from "./config/db.js";

import projectRoutes from "./routes/project.routes.js";
import skillRoutes from "./routes/skill.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import experienceRoutes from "./routes/experience.routes.js";
import educationRoutes from "./routes/education.routes.js";
import testimonialRoutes from "./routes/testimonial.routes.js";
import contactRoutes from "./routes/contact.routes.js";

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Portfolio server is running successfully!",
  });
});

// API Routes
app.use("/api/projects", projectRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/experiences", experienceRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/contact", contactRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Start Server
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

    // Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(`\n⚠️ ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        try {
          await disconnectFromMongoDB();

          console.log("✅ Server closed successfully");
          process.exit(0);
        } catch (error) {
          console.error("❌ Error during shutdown:", error);
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
