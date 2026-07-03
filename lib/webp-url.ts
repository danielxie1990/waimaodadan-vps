/**
 * Server-side helper: rewrites an image URL to its WebP version.
 * No Node.js dependencies — safe for browser/client components.
 * If the original is not an image or already WebP, returns as-is.
 */
export function getWebpUrl(originalUrl: string | null | undefined): string {
  if (!originalUrl) return "";
  if (originalUrl.endsWith(".webp")) return originalUrl;
  if (originalUrl.startsWith("data:")) return originalUrl;
  if (originalUrl.startsWith("http")) return originalUrl;

  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const dot = originalUrl.lastIndexOf(".");
  if (dot === -1) return originalUrl;
  const ext = originalUrl.substring(dot).toLowerCase();
  if (!imageExts.includes(ext)) return originalUrl;

  return originalUrl.replace(/\.[^.]+$/, ".webp");
}
