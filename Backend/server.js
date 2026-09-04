import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import mongoose from "mongoose";
import env from "./config/env.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import masterRoutes from "./routes/masterRoutes.js";

const app = express();

// Behind a proxy (nginx, Render, Heroku) so rate limiting sees the real client IP.
app.set("trust proxy", 1);

// crossOriginResourcePolicy is relaxed so the frontend origin can show /uploads images.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());

// CORS runs before the body parsers so even a parser error carries the header.
app.use(
  cors({
    origin: (origin, callback) => {
      // No origin means a same-origin call or a tool like curl.
      if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Origin not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Uploaded profile pictures are served from <host>/uploads/<file>
app.use("/uploads", express.static("uploads", { maxAge: "7d" }));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/masters", masterRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Turns multer / unexpected errors into JSON instead of an HTML error page.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Profile picture must be under 5MB" });
  }
  if (err.message?.startsWith("Only images")) {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({ message: err.message });
  }

  // Internal details stay in the logs in production.
  res.status(500).json({
    message: env.isProduction ? "Something went wrong" : err.message,
  });
});

const start = async () => {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port} (${env.nodeEnv})`);
  });

  // Finish in-flight requests, then close the database connection.
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start();
