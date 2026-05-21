import express from "express";
import {
  createWorkout,
  deleteWorkout,
  getRecentExercises,
  getWorkoutById,
  getWorkouts,
  updateWorkout
} from "../controllers/workoutController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createWorkout);
router.get("/", protect, getWorkouts);
router.get("/recent-exercises", protect, getRecentExercises);
router.get("/:id", protect, getWorkoutById);
router.put("/:id", protect, updateWorkout);
router.delete("/:id", protect, deleteWorkout);

export default router;
