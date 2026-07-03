"use client";

import { useState } from "react";

interface OptimizedImageProps {
  src: string;           // original image URL
  alt: string;
  webpSrc?: string;      // WebP version (computed if not provided)
  thumbSrc?: string;     // 200px thumbnail
  mediumSrc?: string;    // 800px medium
  size?: "original" | "medium" | "thumb";
  style?: React.CSSProperties;
  className?: string;
  priority?: boolean;    // eager loading
}

/**
 * Computes WebP URL from an original image path.
 * /uploads/photo.jpg → /uploads/photo.webp
 * /uploads/photo.jpg → /uploads/photo-med.webp (medium)
 * /uploads/photo.jpg → /uploads/thumbs/photo-thumb.webp (thumb)
 */
function computeWebpUrl(originalUrl: string, size: "original" | "medium" | "thumb"): string {
  if (!originalUrl || originalUrl.endsWith(".webp")) return originalUrl;
  const lastDot = originalUrl.lastIndexOf(".");
  if (lastDot === -1) return originalUrl;
  const base = originalUrl.substring(0, lastDot);
  if (size === "thumb") {
    const name = base.substring(base.lastIndexOf("/") + 1);
    const dir = base.substring(0, base.lastIndexOf("/"));
    return `${dir}/thumbs/${name}-thumb.webp`;
  }
  if (size === "medium") return `${base}-med.webp`;
  return `${base}.webp`;
}

export default function OptimizedImage({
  src,
  alt,
  webpSrc,
  thumbSrc,
  mediumSrc,
  size = "medium",
  style,
  className,
  priority,
}: OptimizedImageProps) {
  const [showFallback, setShowFallback] = useState(false);

  const webp = webpSrc || computeWebpUrl(src, size);
  const fallback = size === "thumb" ? (thumbSrc || src) : (mediumSrc || src);

  if (showFallback) {
    return (
      <img
        src={fallback}
        alt={alt}
        style={style}
        className={className}
        loading={priority ? "eager" : "lazy"}
      />
    );
  }

  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      <img
        src={fallback}
        alt={alt}
        style={style}
        className={className}
        loading={priority ? "eager" : "lazy"}
        onError={() => setShowFallback(true)}
      />
    </picture>
  );
}
