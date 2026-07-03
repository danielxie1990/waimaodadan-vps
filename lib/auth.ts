import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "gytinbox-dev-secret-change-in-production";

export interface JwtPayload {
  userId: number;
  email: string;
  name: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenFromCookies(): string | null {
  const c = cookies();
  const token = c.get("admin_token")?.value;
  return token || null;
}

export function getAuthFromCookies(): JwtPayload | null {
  const token = getTokenFromCookies();
  if (!token) return null;
  return verifyToken(token);
}
