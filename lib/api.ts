import { NextResponse } from "next/server";
import { getTokenFromCookies, verifyToken } from "./auth";

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function ok(data: unknown) {
  return NextResponse.json(data);
}

export function requireAuth() {
  const token = getTokenFromCookies();
  if (!token) throw unauthorized();
  const payload = verifyToken(token);
  if (!payload) throw unauthorized();
  return payload;
}
