import express from "express";
import rateLimit from "express-rate-limit";
import { checkUsername, searchPublicCities } from "../controllers/publicController.js";

const router = express.Router();

// Separate from the login limiter: these fire as the user types.
router.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 90,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please slow down." }
  })
);

router.get("/username-available", checkUsername);
router.get("/cities", searchPublicCities);

export default router;
