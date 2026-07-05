import sharp from "sharp";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Generate optimized versions of an uploaded image.
 * Returns paths for generated files.
 */
export async function optimizeImage(
  filename: string,        // e.g. "1700000000-photo.jpg"
  buffer: Buffer,
  mimeType: string
): Promise<{
  webpPath: string | null;
  thumbPath: string | null;
  mediumPath: string | null;
}> {
  if (!mimeType.startsWith("image/")) {
    return { webpPath: null, thumbPath: null, mediumPath: null };
  }

  const baseName = filename.replace(/\.[^.]+$/, ""); // "photo"
  const results = { webpPath: null as string | null, thumbPath: null as string | null, mediumPath: null as string | null };

  try {
    // ── WebP (full size, compressed) ──
    const webpFilename = `${baseName}.webp`;
    const webpPath = `/uploads/${webpFilename}`;
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80, effort: 4 })
      .toBuffer();
    await writeFile(path.join(UPLOAD_DIR, webpFilename), webpBuffer);
    results.webpPath = webpPath;

    // ── Thumbnail (200px) ──
    const thumbDir = path.join(UPLOAD_DIR, "thumbs");
    await mkdir(thumbDir, { recursive: true });
    const thumbFilename = `${baseName}-thumb.webp`;
    const thumbPath = `/uploads/thumbs/${thumbFilename}`;
    const thumbBuffer = await sharp(buffer)
      .resize(200, 200, { fit: "cover", position: "center" })
      .webp({ quality: 70, effort: 3 })
      .toBuffer();
    await writeFile(path.join(thumbDir, thumbFilename), thumbBuffer);
    results.thumbPath = thumbPath;

    // ── Medium (800px) ──
    const medFilename = `${baseName}-med.webp`;
    const medPath = `/uploads/${medFilename}`;
    const medBuffer = await sharp(buffer)
      .resize(800, undefined, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75, effort: 4 })
      .toBuffer();
    await writeFile(path.join(UPLOAD_DIR, medFilename), medBuffer);
    results.mediumPath = medPath;

  } catch (err) {
    console.error("Image optimization failed:", err);
  }

  return results;
}

/**
 * @deprecated Use `getWebpUrl` from `@/lib/webp-url` and `getImageUrl` from here instead.
 */
export { getWebpUrl } from "./webp-url";

/**
 * Get the best available URL for an image.
 * Prefers generated WebP variants, falls back to original.
 * Uses the file naming convention from `optimizeImage()`.
 */
export function getImageUrl(
  originalUrl: string,
  size: "original" | "medium" | "thumb" = "medium"
): string {
  if (!originalUrl) return originalUrl;
  if (originalUrl.endsWith(".webp")) return originalUrl;

  const lastDot = originalUrl.lastIndexOf(".");
  if (lastDot === -1) return originalUrl;
  const base = originalUrl.substring(0, lastDot);

  if (size === "thumb") {
    return `/uploads/thumbs/${base.substring("/uploads/".length)}-thumb.webp`;
  }
  if (size === "medium") {
    return `${base}-med.webp`;
  }
  return `${base}.webp`;
}
