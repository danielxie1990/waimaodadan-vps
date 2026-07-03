/**
 * 多语言路由中间件
 *
 * 不再 rewrite URL。只是设置 locale cookie（用于持久化和初始加载）。
 * 前端 locale-prefixed URLs（如 /zh/about-us）由 catch-all 路由处理。
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LOCALES = [
  "en", "zh", "es", "de", "fr", "ar", "ja", "ko",
  "ru", "it", "pt", "th", "vi", "nl", "pl", "tr",
];

const DEFAULT_LOCALE = "en";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Don't process static assets and API
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  // Redirect old /tin-containers/ to /products/
  if (pathname.startsWith("/tin-containers")) {
    const newPath = pathname.replace("/tin-containers", "/products");
    return NextResponse.redirect(new URL(newPath, request.url), { status: 301 });
  }

  // Detect locale from URL first segment
  const segments = pathname.split("/").filter(Boolean);
  let locale = DEFAULT_LOCALE;
  if (segments.length > 0 && SUPPORTED_LOCALES.includes(segments[0])) {
    locale = segments[0];
  }

  // Set locale cookie (no rewrite — catch-all route handles locale-prefixed URLs)
  const response = NextResponse.next();
  response.cookies.set("locale", locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images/).*)",
  ],
};
