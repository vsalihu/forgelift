import express from "express";
import {
  createWorkoutTemplate,
  deleteWorkoutTemplate,
  getFriendsPublicTemplates,
  getWorkoutTemplate,
  getWorkoutTemplates,
  updateWorkoutTemplate,
  updateWorkoutTemplateVisibility
} from "../controllers/workoutTemplateController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getWorkoutTemplates);
router.get("/friends/public", protect, getFriendsPublicTemplates);
router.get("/:id", protect, getWorkoutTemplate);
router.post("/", protect, createWorkoutTemplate);
router.put("/:id", protect, updateWorkoutTemplate);
router.put("/:id/visibility", protect, updateWorkoutTemplateVisibility);
router.delete("/:id", protect, deleteWorkoutTemplate);

export default router;
