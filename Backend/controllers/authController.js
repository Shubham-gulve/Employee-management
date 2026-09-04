import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import env from "../config/env.js";

const signToken = (user) =>
  jwt.sign({ id: user._id.toString(), email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

// Public sign-up is off unless ALLOW_REGISTRATION=true; the admin is seeded.
export const registerUser = async (req, res, next) => {
  try {
    if (!env.allowRegistration) {
      return res.status(403).json({ message: "Registration is disabled" });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    await User.create({
      name,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 10),
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    // Same response for unknown email and wrong password, so accounts cannot be probed.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

// Lets the frontend confirm a stored token is still valid.
export const getMe = (req, res) => {
  res.status(200).json({ user: { id: req.user.id, email: req.user.email } });
};
