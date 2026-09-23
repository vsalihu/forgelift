import jwt from "jsonwebtoken";

export const generateToken = (userId, rememberMe = true) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from environment variables.");
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? "90d" : "1d"
  });
};
