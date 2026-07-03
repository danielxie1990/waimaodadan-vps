"use client";

import { useRef, useState } from "react";
import MediaPicker from "./MediaPicker";

interface GalleryImage {
  url: string;
  alt?: string;
  id?: number;
}

interface ImageUploaderProps {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  maxImages?: number;
}

export default function ImageUploader({ images, onChange, maxImages = 20 }: ImageUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const handleUpload = async (files: File[]) => {
    if (files.length === 0 || images.length >= maxImages) return;
    setUploading(true);
    setShowMenu(false);

    const now = Date.now();
    const entries = files.slice(0, maxImages - images.length).map((f, i) => ({
      file: f, tempId: now + i,
    }));

    const withPreviews = [...images, ...entries.map(e => ({ url: URL.createObjectURL(e.file), id: e.tempId }) as GalleryImage)];
    onChange(withPreviews);

    const results = await Promise.allSettled(
      entries.map(async (e) => {
        const fd = new FormData();
        fd.append("file", e.file);
        const res = await fetch("/api/media/", { method: "POST", body: fd });
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
        const media = await res.json();
        return { tempId: e.tempId, url: media.url, alt: media.alt };
      })
    );

    const final = withPreviews.map(img => {
      const result = results.find(r => r.status === "fulfilled" && (r as PromiseFulfilledResult<any>).value.tempId === img.id);
      if (result?.status === "fulfilled") {
        const v = (result as PromiseFulfilledResult<any>).value;
        return { url: v.url, alt: v.alt || "" };
      }
      return entries.find(e => e.tempId === img.id) ? null : img;
    }).filter(Boolean) as GalleryImage[];

    onChange(final);
    setUploading(false);
  };

  function handleMediaSelect(urls: string[]) {
    onChange([...images, ...urls.map(url => ({ url }))]);
    setShowMediaPicker(false);
    setShowMenu(false);
  }

  const removeImage = (index: number) => onChange(images.filter((_, i) => i !== index));

  const moveImage = (from: number, direction: "up" | "down") => {
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPicker
          multiSelect
          onSelectMultiple={handleMediaSelect}
          onSelect={() => {}}
          onClose={() => { setShowMediaPicker(false); setShowMenu(false); }}
        />
      )}

      {/* Image Grid */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        {images.map((img, index) => (
          <div key={img.id || index} style={{
            position: "relative", width: 120, height: 120, borderRadius: 8, overflow: "hidden",
            border: "1px solid #e2e8f0", background: "#f8fafc",
          }}>
            <img src={img.url} alt={img.alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div className="img-overlay" style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", opacity: 0,
              transition: "opacity 0.2s", display: "flex", flexDirection: "column",
              justifyContent: "center", alignItems: "center", gap: 4,
            }}>
              <div style={{ display: "flex", gap: 4 }}>
                {index > 0 && <button type="button" onClick={(e) => { e.stopPropagation(); moveImage(index, "up"); }} style={overBtn} title="Move left">←</button>}
                {index < images.length - 1 && <button type="button" onClick={(e) => { e.stopPropagation(); moveImage(index, "down"); }} style={overBtn} title="Move right">→</button>}
                <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(index); }} style={{ ...overBtn, background: "#ef4444" }} title="Delete">✕</button>
              </div>
            </div>
          </div>
        ))}

        {/* Add Image button */}
        {images.length < maxImages && (
          <div onClick={() => setShowMenu(true)}
            style={{
              width: 120, height: 120, borderRadius: 8, border: "2px dashed #d1d5db",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              cursor: uploading ? "wait" : "pointer", color: "#9ca3af", fontSize: 13,
              position: "relative",
            }}
          >
            {uploading ? <span>Uploading...</span> : <><span style={{ fontSize: 28, lineHeight: 1 }}>+</span><span style={{ marginTop: 4 }}>Add Image</span></>}

            {/* Popup Menu */}
            {showMenu && !uploading && (
              <div style={{
                position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
                background: "#fff", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                border: "1px solid #e5e7eb", padding: 6, zIndex: 10, minWidth: 160, marginBottom: 6,
              }} onClick={e => e.stopPropagation()}>
                <button type="button" onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); setShowMenu(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "none", borderRadius: 6, background: "transparent", cursor: "pointer", fontSize: 13, width: "100%", textAlign: "left", color: "#374151" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontSize: 18 }}>📁</span>
                  <span>Upload from computer</span>
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); setShowMediaPicker(true); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "none", borderRadius: 6, background: "transparent", cursor: "pointer", fontSize: 13, width: "100%", textAlign: "left", color: "#374151" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontSize: 18 }}>🖼️</span>
                  <span>From Media Library</span>
                </button>
                {/* Close menu on outside click */}
                <div style={{ borderTop: "1px solid #f3f4f6", marginTop: 4, paddingTop: 4 }}>
                  <button type="button" onClick={() => setShowMenu(false)}
                    style={{ display: "block", padding: "6px 12px", border: "none", borderRadius: 6, background: "transparent", cursor: "pointer", fontSize: 12, color: "#9ca3af", width: "100%", textAlign: "center" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) handleUpload(files);
          if (fileRef.current) fileRef.current.value = "";
        }} />

      {/* Close menu on click outside */}
      {showMenu && <div style={{ position: "fixed", inset: 0, zIndex: 5 }} onClick={() => setShowMenu(false)} />}

      <style>{`div:hover > .img-overlay { opacity: 1 !important; }`}</style>
    </div>
  );
}

const overBtn: React.CSSProperties = {
  padding: "4px 8px", background: "rgba(255,255,255,0.9)",
  border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, color: "#374151", lineHeight: 1,
};
