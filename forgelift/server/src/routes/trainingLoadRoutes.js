import express from "express";
import { getTrainingLoad } from "../controllers/trainingLoadController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getTrainingLoad);

export default router;
