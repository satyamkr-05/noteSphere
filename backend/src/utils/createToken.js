import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/env.js";

export function createToken(userId) {
  return jwt.sign({ userId }, getJwtSecret(), {
    expiresIn: "7d"
  });
}
