/**
 * 多语言路由工具
 */

export const DEFAULT_LOCALE = "en";

export const SUPPORTED_LOCALES = [
  "en", "zh", "es", "de", "fr", "ar", "ja", "ko",
  "ru", "it", "pt", "th", "vi", "nl", "pl", "tr",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isLocale(str: string): str is Locale {
  return SUPPORTED_LOCALES.includes(str as Locale);
}

/**
 * 获取当前语言（服务端组件）
 *
 * 策略（按优先级）:
 * 1. searchParams.__locale — 由 middleware rewrite 注入，对 RSC 数据请求可见
 * 2. x-middleware-rewrite header — rewrite 前的原始 URL
 * 3. locale cookie — 由 middleware 设置，后续请求生效
 * 4. next-url header — fallback URL 解析
 * 5. DEFAULT_LOCALE
 *
 * 页面组件使用:
 *   const locale = getLocaleFromHeaders(searchParams);
 * 非页面组件使用:
 *   const locale = getLocaleFromHeaders();
 */
export function getLocaleFromHeaders(
  searchParams?: Record<string, string | string[] | undefined> | { __locale?: string }
): string {
  // Priority 1: searchParams (由 middleware 通过 rewrite URL 注入)
  if (searchParams?.__locale && typeof searchParams.__locale === "string") {
    return searchParams.__locale;
  }

  try {
    const { headers } = require("next/headers");
    const h = headers();

    // Priority 2: x-middleware-rewrite (原始请求 URL)
    const rewriteUrl = h.get("x-middleware-rewrite") || "";
    if (rewriteUrl) {
      const segs = rewriteUrl.split("/").filter(Boolean);
      if (segs.length > 0 && isLocale(segs[0])) return segs[0];
    }

    // Priority 3: cookie
    const { cookies } = require("next/headers");
    const cookieLocale = cookies().get("locale")?.value;
    if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;

    // Priority 4: next-url
    const nextUrl = h.get("next-url") || "";
    if (nextUrl) {
      const segs = nextUrl.split("/").filter(Boolean);
      if (segs.length > 0 && isLocale(segs[0])) return segs[0];
    }

    return DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

/**
 * 校验 locale 是否是有效值
 */
export function normalizeLocale(locale: string | null | undefined): string {
  if (locale && isLocale(locale)) return locale;
  return DEFAULT_LOCALE;
}

/**
 * 把 原始路径 + locale 转成数据库里的 slug
 *
 * 举例:
 *   resolveDbSlug("about-us", "en")  => "about-us"
 *   resolveDbSlug("about-us", "zh")  => "zh/about-us"
 *   resolveDbSlug("home", "zh")      => "zh/home"
 *   resolveDbSlug("", "zh")          => "zh"
 */
export function resolveDbSlug(slug: string, locale: string): string {
  if (!locale || locale === DEFAULT_LOCALE) return slug;
  if (!slug || slug === "/") return locale;
  return `${locale}/${slug}`.replace(/\/\//g, "/");
}

/**
 * 把数据库里的 locale slug 还原成干净的 slug（去掉语言前缀）
 */
export function cleanSlug(dbSlug: string): string {
  for (const loc of SUPPORTED_LOCALES) {
    if (dbSlug.startsWith(`${loc}/`)) {
      return dbSlug.slice(loc.length + 1);
    }
  }
  return dbSlug;
}

/**
 * 构建 locale 感知的 URL
 */
export function localizeUrl(path: string, locale: string): string {
  if (!locale || locale === DEFAULT_LOCALE) return path || "/";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${cleanPath === "/" ? "" : cleanPath}`;
}

/**
 * 当前 locale 的语言名称
 */
export const LOCALE_NAMES: Record<string, { name: string; flag: string }> = {
  en: { name: "English", flag: "🇬🇧" },
  zh: { name: "中文", flag: "🇨🇳" },
  es: { name: "Español", flag: "🇪🇸" },
  de: { name: "Deutsch", flag: "🇩🇪" },
  fr: { name: "Français", flag: "🇫🇷" },
  ar: { name: "العربية", flag: "🇸🇦" },
  ja: { name: "日本語", flag: "🇯🇵" },
  ko: { name: "한국어", flag: "🇰🇷" },
  ru: { name: "Русский", flag: "🇷🇺" },
  it: { name: "Italiano", flag: "🇮🇹" },
  pt: { name: "Português", flag: "🇧🇷" },
  th: { name: "ไทย", flag: "🇹🇭" },
  vi: { name: "Tiếng Việt", flag: "🇻🇳" },
  nl: { name: "Nederlands", flag: "🇳🇱" },
  pl: { name: "Polski", flag: "🇵🇱" },
  tr: { name: "Türkçe", flag: "🇹🇷" },
};
