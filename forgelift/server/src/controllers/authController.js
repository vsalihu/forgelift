import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { validateEmail, validateUsername } from "../utils/validation.js";

const authResponse = (user) => ({
  token: generateToken(user._id),
  user: user.toJSON()
});

export const register = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    if (!name?.trim() || !email?.trim() || !username?.trim() || !password) {
      return res.status(400).json({ message: "Name, email, username, and password are required." });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const normalizedUsername = username.trim().toLowerCase();

    if (!validateUsername(normalizedUsername)) {
      return res.status(400).json({ message: "Username must be 3-20 characters: letters, numbers, and underscores only." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const [existingEmail, existingUsername] = await Promise.all([
      User.findOne({ email: email.toLowerCase() }),
      User.findOne({ username: normalizedUsername })
    ]);

    if (existingEmail) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    if (existingUsername) {
      return res.status(409).json({ message: "That username is already taken." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      username: normalizedUsername,
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
