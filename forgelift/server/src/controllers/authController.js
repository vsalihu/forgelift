import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { getCityById } from "../utils/cities.js";
import {
  getDefaultUnitsForCountry,
  isValidTimezone,
  parseDateOfBirth,
  validateEmail,
  validatePassword,
  validateUsername
} from "../utils/validation.js";

const authResponse = (user, rememberMe = true) => ({
  token: generateToken(user._id, rememberMe),
  user: user.toJSON()
});

const fieldError = (res, status, field, message) => res.status(status).json({ message, field });

export const register = async (req, res) => {
  try {
    const { name, email, username, password, dateOfBirth, cityId, timezone } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedUsername = String(username || "").trim().toLowerCase();

    if (!validateEmail(normalizedEmail)) {
      return fieldError(res, 400, "email", "Please enter a valid email address.");
    }

    const passwordProblem = validatePassword(password);
    if (passwordProblem) {
      return fieldError(res, 400, "password", passwordProblem);
    }

    if (!String(name || "").trim()) {
      return fieldError(res, 400, "name", "Enter your name.");
    }

    if (String(name).trim().length > 60) {
      return fieldError(res, 400, "name", "Keep your name under 60 characters.");
    }

    if (!validateUsername(normalizedUsername)) {
      return fieldError(res, 400, "username", "Username must be 3-20 characters: letters, numbers, and underscores only.");
    }

    const birth = parseDateOfBirth(dateOfBirth);
    if (birth.error) {
      return fieldError(res, 400, "dateOfBirth", birth.error);
    }

    const city = getCityById(cityId);
    if (!city) {
      return fieldError(res, 400, "cityId", "Choose your city from the list.");
    }

    const [existingEmail, existingUsername] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      User.findOne({ username: normalizedUsername })
    ]);

    if (existingEmail) {
      return fieldError(res, 409, "email", "An account with this email already exists.");
    }

    if (existingUsername) {
      return fieldError(res, 409, "username", "That username is already taken.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      username: normalizedUsername,
      passwordHash,
      dateOfBirth: birth.date,
      age: birth.age,
      location: {
        cityId: city.cityId,
        cityName: city.name,
        countryCode: city.countryCode,
        countryName: city.countryName
      },
      timezone: isValidTimezone(timezone) ? timezone : "",
      preferredUnits: getDefaultUnitsForCountry(city.countryCode)
    });

    return res.status(201).json(authResponse(user, req.body.rememberMe !== false));
  } catch (error) {
    if (error?.code === 11000) {
      const field = error.keyPattern?.username ? "username" : "email";
      return fieldError(res, 409, field, field === "username" ? "That username is already taken." : "An account with this email already exists.");
    }
    return res.status(500).json({ message: "Unable to register account.", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json(authResponse(user, rememberMe !== false));
  } catch (error) {
    return res.status(500).json({ message: "Unable to login.", error: error.message });
  }
};
