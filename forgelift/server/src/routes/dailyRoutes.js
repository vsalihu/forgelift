import express from "express";
import { createCustomTodo, deleteCustomTodo, getDay, updateCustomTodo, updateDay, updateProfile } from "../controllers/dailyController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.post("/todos", protect, createCustomTodo);
router.put("/todos/:id", protect, updateCustomTodo);
router.delete("/todos/:id", protect, deleteCustomTodo);
router.get("/:day", protect, getDay);
router.patch("/:day", protect, updateDay);

export default router;
