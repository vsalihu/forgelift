import User from "../models/User.js";
import { searchCities } from "../utils/cities.js";
import { validateUsername } from "../utils/validation.js";

// Lookups the sign-up form needs before the user has an account.

export const checkUsername = async (req, res) => {
  try {
    const username = String(req.query.username || "").trim().toLowerCase();
    if (!validateUsername(username)) {
      return res.json({ username, available: false, reason: "invalid" });
    }
    const taken = await User.exists({ username });
    return res.json({ username, available: !taken, reason: taken ? "taken" : null });
  } catch (error) {
    return res.status(500).json({ message: "Unable to check username.", error: error.message });
  }
};

export const searchPublicCities = (req, res) => res.json({ cities: searchCities(req.query.q, 8) });
