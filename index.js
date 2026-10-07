import express from "express";
import cors from "cors";

import { connectToMongoDB, disconnectFromMongoDB } from "./config/db.js";

const app = express();

const PORT = process.env.PORT || 5000;

// ========================================
// Middleware
// ========================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// Health Check
// ========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Portfolio server is running successfully!",
  });
});

// ========================================
// Start Server
// ========================================

const startServer = async () => {
  try {
    await connectToMongoDB();

    app.listen(PORT, () => {
      console.log(`🚀 Portfolio server running on port ${PORT}`);
      console.log(`🌐 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// ========================================
// Graceful Shutdown
// ========================================

const shutdown = async (signal) => {
  console.log(`\n⚠️ ${signal} received. Shutting down gracefully...`);

  await disconnectFromMongoDB();

  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ========================================
// Start Application
// ========================================

startServer();
