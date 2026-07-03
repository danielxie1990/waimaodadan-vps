"use client";

import { useEffect, useState } from "react";

interface MediaItem {
  id: number;
  url: string;
  alt: string | null;
  filename: string;
  mimeType: string;
}

interface MediaPickerProps {
  onSelect: (url: string) => void;
  onSelectMultiple?: (urls: string[]) => void;
  onClose: () => void;
  multiSelect?: boolean;
}

export default function MediaPicker({ onSelect, onSelectMultiple, onClose, multiSelect = false }: MediaPickerProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/media")
      .then(r => r.json())
      .then(data => {
        setMedia(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = search
    ? media.filter(m => (m.filename || "").toLowerCase().includes(search.toLowerCase()) || (m.alt || "").toLowerCase().includes(search.toLowerCase()))
    : media;

  function toggleItem(id: number) {
    if (!multiSelect) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleItemClick(item: MediaItem) {
    if (multiSelect) {
      toggleItem(item.id);
    } else {
      onSelect(item.url);
    }
  }

  function handleSelectMultiple() {
    if (onSelectMultiple) {
      const urls = media.filter(m => selected.has(m.id)).map(m => m.url);
      onSelectMultiple(urls);
    }
  }

  const gridItem: React.CSSProperties = {
    cursor: "pointer", borderRadius: 8, overflow: "hidden",
    border: "1px solid #e5e7eb", transition: "border-color 0.15s, box-shadow 0.15s",
    background: "#fafafa", position: "relative",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 12, width: 750, maxWidth: "90vw",
        maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", borderBottom: "1px solid #e5e7eb",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            📁 Media Library{multiSelect ? ` (${selected.size} selected)` : ""}
          </h2>
          <button type="button" onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af", padding: 4 }}>✕</button>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search media..."
            style={{
              width: "100%", padding: "8px 12px", border: "1px solid #d1d5db",
              borderRadius: 6, fontSize: 14, boxSizing: "border-box",
            }} />
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          {loading ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>Loading...</p>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>
              {search ? "No matching files" : "No media uploaded yet."}
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
              {filtered.map(item => {
                const isChecked = selected.has(item.id);
                return (
                  <div key={item.id} onClick={() => handleItemClick(item)}
                    onMouseEnter={e => { if (!isChecked) { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(59,130,246,0.15)"; } }}
                    onMouseLeave={e => { if (!isChecked) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; } }}
                    style={{
                      ...gridItem,
                      borderColor: isChecked ? "#3b82f6" : "#e5e7eb",
                      boxShadow: isChecked ? "0 0 0 2px #3b82f6" : "none",
                    }}>
                    {multiSelect && (
                      <div style={{
                        position: "absolute", top: 6, left: 6, zIndex: 2,
                        width: 22, height: 22, borderRadius: 4,
                        background: isChecked ? "#2563eb" : "rgba(255,255,255,0.85)",
                        border: isChecked ? "none" : "2px solid #94a3b8",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 12, fontWeight: 700,
                      }}>
                        {isChecked ? "✓" : ""}
                      </div>
                    )}
                    <div style={{
                      height: 100, display: "flex", alignItems: "center", justifyContent: "center",
                      background: "#f3f4f6",
                    }}>
                      {item.mimeType?.startsWith("video") ? (
                        <span style={{ fontSize: 24 }}>🎬</span>
                      ) : (
                        <img src={item.url} alt={item.alt || ""}
                          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      )}
                    </div>
                    <div style={{ padding: "6px 8px", fontSize: 11, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.filename || "Untitled"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 20px", borderTop: "1px solid #e5e7eb",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            {multiSelect ? "Click to select multiple images" : "Click an image to select it"}
          </span>
          {multiSelect ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={onClose}
                style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
              <button type="button" onClick={handleSelectMultiple} disabled={selected.size === 0}
                style={{
                  padding: "8px 16px", border: "none", borderRadius: 6, cursor: selected.size === 0 ? "not-allowed" : "pointer",
                  background: selected.size === 0 ? "#93c5fd" : "#2563eb", color: "#fff", fontSize: 13, fontWeight: 600,
                }}>
                Add {selected.size > 0 ? `${selected.size} image${selected.size > 1 ? "s" : ""}` : "selected"}
              </button>
            </div>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}
