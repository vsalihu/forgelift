import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { seedExercises } from "./utils/seedExercises.js";
import { seedDemoData } from "./utils/seedDemoData.js";
import { backfillUsernames } from "./utils/backfillUsernames.js";
import { cleanupOrphanedFeedItems } from "./utils/cleanupOrphanedFeedItems.js";
import activityRoutes from "./routes/activityRoutes.js";
import advancedAnalyticsRoutes from "./routes/advancedAnalyticsRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bodyweightRoutes from "./routes/bodyweightRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import challengeRoutes from "./routes/challengeRoutes.js";
import coopSessionRoutes from "./routes/coopSessionRoutes.js";
import dataManagementRoutes from "./routes/dataManagementRoutes.js";
import deloadRoutes from "./routes/deloadRoutes.js";
import exerciseRoutes from "./routes/exerciseRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import missionRoutes from "./routes/missionRoutes.js";
import monthlyReportRoutes from "./routes/monthlyReportRoutes.js";
import overloadRoutes from "./routes/overloadRoutes.js";
import personalRecordRoutes from "./routes/personalRecordRoutes.js";
import rankRoutes from "./routes/rankRoutes.js";
import recoveryRoutes from "./routes/recoveryRoutes.js";
import strengthBaselineRoutes from "./routes/strengthBaselineRoutes.js";
import trainingBalanceRoutes from "./routes/trainingBalanceRoutes.js";
import trainingPlanRoutes from "./routes/trainingPlanRoutes.js";
import tutorialRoutes from "./routes/tutorialRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import weakPointRoutes from "./routes/weakPointRoutes.js";
import workoutRoutes from "./routes/workoutRoutes.js";
import workoutTemplateRoutes from "./routes/workoutTemplateRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS."));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts. Please try again later." }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "ForgeLift API" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/advanced-analytics", advancedAnalyticsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/bodyweight", bodyweightRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/coop-sessions", coopSessionRoutes);
app.use("/api/data-management", dataManagementRoutes);
app.use("/api/deload", deloadRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/monthly-reports", monthlyReportRoutes);
app.use("/api/overload", overloadRoutes);
app.use("/api/personal-records", personalRecordRoutes);
app.use("/api/ranks", rankRoutes);
app.use("/api/recovery", recoveryRoutes);
app.use("/api/strength-baselines", strengthBaselineRoutes);
app.use("/api/training-balance", trainingBalanceRoutes);
app.use("/api/training-plans", trainingPlanRoutes);
app.use("/api/tutorials", tutorialRoutes);
app.use("/api/users", userRoutes);
app.use("/api/weak-points", weakPointRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/workout-templates", workoutTemplateRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    try {
      const result = await backfillUsernames();
      if (result.updated) console.log("Backfilled usernames for existing users:", result);
    } catch (error) {
      console.error("Username backfill failed:", error.message);
    }

    try {
      const result = await cleanupOrphanedFeedItems();
      if (result.removed) console.log("Removed orphaned activity feed items:", result);
    } catch (error) {
      console.error("Activity feed cleanup failed:", error.message);
    }

    try {
      const result = await seedExercises();
      console.log("Exercise library seeded:", result);
    } catch (error) {
      console.error("Exercise seed failed:", error.message);
    }

    if (process.env.SEED_DEMO_DATA === "true") {
      try {
        await seedDemoData();
        console.log("Demo data seeded.");
      } catch (error) {
        console.error("Demo seed failed:", error.message);
      }
    }

    app.listen(port, () => {
      console.log(`ForgeLift API running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
