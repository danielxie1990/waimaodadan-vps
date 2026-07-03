"use client";
import { useState } from "react";
import OptimizedImage from "@/components/OptimizedImage";
import { getWebpUrl } from "@/lib/webp-url";

export default function ProductGallery({ images, title, video }: { images: string[]; title: string; video?: string | null }) {
  const [mode, setMode] = useState<"video" | "image">(video ? "video" : "image");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const ytMatch = video?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  const youtubeId = ytMatch?.[1];
  const hasVideo = !!youtubeId;

  const items: { type: "video" | "image"; src?: string }[] = [
    ...(hasVideo ? [{ type: "video" as const }] : []),
    ...images.map(src => ({ type: "image" as const, src })),
  ];

  const currentItem = items[selectedIdx];

  return (
    <>
      {/* Main media area */}
      <div className="bg-gray-100 rounded-lg flex items-center justify-center h-96 mb-4 relative overflow-hidden">
        {currentItem?.type === "video" && youtubeId ? (
          <div style={{ width: "100%", height: "100%" }}>
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={title}
              style={{ width: "100%", height: "100%", border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : currentItem?.src ? (
          <OptimizedImage src={currentItem.src} alt={title} size="original"
            className="max-w-full max-h-96 object-contain" />
        ) : images[0] ? (
          <OptimizedImage src={images[0]} alt={title} size="original"
            className="max-w-full max-h-96 object-contain" />
        ) : (
          <span className="text-gray-400">No image</span>
        )}
      </div>

      {/* Thumbnails strip */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => setSelectedIdx(i)}
              className={`w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-50 transition relative ${
                i === selectedIdx
                  ? "border-2 border-red-600 ring-1 ring-red-300"
                  : "border border-gray-200 hover:border-red-400"
              }`}
            >
              {item.type === "video" ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                  <span style={{ fontSize: 28 }}>▶</span>
                </div>
              ) : (
                <img src={getWebpUrl(item.src)} alt={`${title} ${i}`} className="w-full h-full object-cover" />
              )}
              {item.type === "video" && (
                <span style={{
                  position: "absolute", bottom: 2, right: 2,
                  background: "rgba(0,0,0,0.7)", color: "#fff",
                  fontSize: 9, padding: "1px 4px", borderRadius: 3,
                }}>
                  Video
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
