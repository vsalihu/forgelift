import express from "express";
import {
  createCustomExercise,
  createExercise,
  deleteCustomExercise,
  getExerciseById,
  getExercises,
  updateCustomExercise
} from "../controllers/exerciseController.js";
import { optionalProtect, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", optionalProtect, getExercises);
router.get("/:id", optionalProtect, getExerciseById);
router.post("/", protect, createExercise);
router.post("/custom", protect, createCustomExercise);
router.put("/custom/:id", protect, updateCustomExercise);
router.delete("/custom/:id", protect, deleteCustomExercise);

export default router;
