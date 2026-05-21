import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "IronRank API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`IronRank API running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
