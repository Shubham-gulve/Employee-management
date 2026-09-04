import jwt from "jsonwebtoken";
import env from "../config/env.js";

// Every employee and master route sits behind this check.
const protect = (req, res, next) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorised" });
  }

  try {
    req.user = jwt.verify(header.slice(7), env.jwtSecret);
    next();
  } catch {
    res.status(401).json({ message: "Session expired, please log in again" });
  }
};

export default protect;
