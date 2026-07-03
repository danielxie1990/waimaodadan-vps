"use client";

import { useState, useEffect, useRef } from "react";
import { getWebpUrl } from "@/lib/webp-url";

interface MediaItem {
  id: number;
  filename: string;
  url: string;
  mimeType: string;
  fileSize: number;
  alt: string;
  webpUrl?: string;
  thumbUrl?: string;
  createdAt: string;
}

interface MediaBrowserProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function MediaBrowser({ onSelect, onClose }: MediaBrowserProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadMedia() {
    setLoading(true);
    try {
      const res = await fetch("/api/media/");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadMedia(); }, []);

  async function uploadFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/media/", { method: "POST", body: fd });
      if (res.ok) {
        const m = await res.json();
        loadMedia(); // Refresh list
        onSelect(m.url);
        onClose();
      }
    } catch {}
    setUploading(false);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 12, width: 700, maxWidth: "90vw",
        maxHeight: "80vh", display: "flex", flexDirection: "column",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid #e5e7eb",
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>🖼️ Media Library</h3>
          <button type="button" onClick={onClose}
            style={{ padding: "4px 12px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>

        {/* Upload area */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { uploadFile(f); if (fileRef.current) fileRef.current.value = ""; } }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{
              padding: "8px 20px", border: "1px dashed #94a3b8", borderRadius: 8,
              background: "#f8fafc", cursor: "pointer", fontSize: 13, color: "#475569",
              width: "100%", opacity: uploading ? 0.6 : 1,
            }}>
            {uploading ? "⏳ Uploading..." : "📁 Click to upload from computer"}
          </button>
        </div>

        {/* Media grid */}
        <div style={{ flex: 1, overflow: "auto", padding: "12px 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading...</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              No media yet. Upload some images!
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { onSelect(getWebpUrl(item.webpUrl || item.url)); onClose(); }}
                  style={{
                    border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#3b82f6"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(59,130,246,0.15)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  <div style={{
                    height: 120, background: "#f8fafc",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    <img src={item.thumbUrl || item.webpUrl || item.url} alt={item.alt || ""} style={{
                      width: "100%", height: "100%", objectFit: "cover",
                    }}
                      onError={e => { (e.target as HTMLImageElement).src = item.url; }} />
                  </div>
                  <div style={{ padding: "6px 8px" }}>
                    <p style={{
                      margin: 0, fontSize: 11, color: "#374151",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{item.filename}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>
                      {item.fileSize ? `${(item.fileSize / 1024).toFixed(0)} KB` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
