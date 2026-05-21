import express from "express";
import {
  createWorkoutTemplate,
  deleteWorkoutTemplate,
  getWorkoutTemplate,
  getWorkoutTemplates,
  updateWorkoutTemplate
} from "../controllers/workoutTemplateController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getWorkoutTemplates);
router.get("/:id", protect, getWorkoutTemplate);
router.post("/", protect, createWorkoutTemplate);
router.put("/:id", protect, updateWorkoutTemplate);
router.delete("/:id", protect, deleteWorkoutTemplate);

export default router;
