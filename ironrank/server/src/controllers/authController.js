import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { validateEmail } from "../utils/validation.js";

const authResponse = (user) => ({
  token: generateToken(user._id),
  user: user.toJSON()
});

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash
    });

    return res.status(201).json(authResponse(user));
  } catch (error) {
    return res.status(500).json({ message: "Unable to register account.", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

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

    return res.json(authResponse(user));
  } catch (error) {
    return res.status(500).json({ message: "Unable to login.", error: error.message });
  }
};
