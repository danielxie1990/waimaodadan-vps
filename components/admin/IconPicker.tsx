"use client";

import { useState, useRef, useEffect } from "react";

// ─── Font Awesome icon list (commonly used) ─────
const FA_ICONS = [
  // Objects
  "fa-cube", "fa-box", "fa-box-open", "fa-boxes", "fa-cubes",
  "fa-tag", "fa-tags", "fa-qrcode", "fa-barcode",
  // Industry
  "fa-industry", "fa-wrench", "fa-tools", "fa-cogs", "fa-gear",
  "fa-cog", "fa-hammer", "fa-paint-roller", "fa-screwdriver-wrench",
  "fa-tape", "fa-ruler", "fa-ruler-combined", "fa-ruler-horizontal",
  "fa-ruler-vertical", "fa-weight-scale", "fa-weight-hanging",
  // Shield / Security
  "fa-shield", "fa-shield-halved", "fa-lock", "fa-lock-open",
  "fa-check-shield", "fa-bolt", "fa-certificate", "fa-medal",
  // Files
  "fa-file", "fa-file-lines", "fa-file-pdf", "fa-file-image",
  "fa-file-csv", "fa-file-export", "fa-file-import",
  "fa-copy", "fa-clipboard", "fa-clipboard-list", "fa-clipboard-check",
  // Shapes
  "fa-circle", "fa-square", "fa-octagon", "fa-hexagon",
  "fa-triangle-exclamation", "fa-rectangle", "fa-cylinder",
  // Transport
  "fa-truck", "fa-truck-fast", "fa-truck-moving", "fa-ship",
  "fa-plane", "fa-box-archive", "fa-warehouse", "fa-container",
  // Science
  "fa-flask", "fa-test-tube", "fa-microscope", "fa-dna",
  "fa-leaf", "fa-seedling", "fa-tree", "fa-recycle",
  // Nature
  "fa-water", "fa-droplet", "fa-fire", "fa-snowflake", "fa-sun",
  "fa-moon", "fa-cloud", "fa-bolt", "fa-wind",
  // Arrows
  "fa-arrow-right", "fa-arrow-left", "fa-up-down", "fa-arrows",
  "fa-arrows-rotate", "fa-arrow-up-right-from-square",
  "fa-expand", "fa-compress", "fa-maximize", "fa-minimize",
  // Tech
  "fa-microchip", "fa-cpu", "fa-memory", "fa-server",
  "fa-database", "fa-chart-line", "fa-chart-bar", "fa-chart-pie",
  "fa-chart-simple", "fa-robot", "fa-phone", "fa-mobile-screen",
  // Communication
  "fa-envelope", "fa-message", "fa-comment", "fa-comments",
  "fa-share-nodes", "fa-share", "fa-link", "fa-paper-plane",
  // Design
  "fa-palette", "fa-paintbrush", "fa-pen", "fa-pen-ruler",
  "fa-eraser", "fa-eye", "fa-eye-dropper", "fa-sliders",
  // Business
  "fa-star", "fa-star-half-stroke", "fa-heart", "fa-thumbs-up",
  "fa-check", "fa-check-circle", "fa-check-double",
  "fa-circle-info", "fa-info", "fa-question-circle", "fa-exclamation-circle",
  "fa-bell", "fa-flag", "fa-bookmark", "fa-fire-flame-curved",
  // Hands
  "fa-hand", "fa-hand-peace", "fa-handshake", "fa-thumbs-up",
  "fa-thumbs-down", "fa-hand-pointer",
  // Money
  "fa-money-bill", "fa-money-bills", "fa-credit-card", "fa-coins",
  "fa-sack-dollar", "fa-scale-balanced", "fa-gem",
  // Users
  "fa-user", "fa-users", "fa-user-group", "fa-user-gear",
  "fa-id-card", "fa-id-badge", "fa-address-card",
  // Map / Location
  "fa-location-dot", "fa-map", "fa-map-pin", "fa-map-location-dot",
  "fa-globe", "fa-earth-americas", "fa-compass",
  // Time
  "fa-clock", "fa-calendar", "fa-calendar-days", "fa-stopwatch",
  "fa-hourglass", "fa-clock-rotate-left",
  // Media
  "fa-camera", "fa-video", "fa-film", "fa-image", "fa-images",
  "fa-photo-film", "fa-play", "fa-circle-play",
  // Social
  "fa-thumbs-up", "fa-heart", "fa-face-smile", "fa-face-frown",
  "fa-face-laugh", "fa-face-meh", "fa-face-grin",
  // Food
  "fa-utensils", "fa-mug-hot", "fa-wine-bottle", "fa-beer-mug",
  "fa-wine-glass", "fa-bowl-food", "fa-cake-candles",
  // Misc
  "fa-gift", "fa-trophy", "fa-award", "fa-magnet", "fa-broom",
  "fa-fan", "fa-lightbulb", "fa-bomb", "fa-bug", "fa-rocket",
];

// ─── IconPicker Component ─────────────────────
interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load Font Awesome CSS once globally
  useEffect(() => {
    if (!document.querySelector("link[href*='font-awesome']")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    setIsCustom(!!value && !value.startsWith("fa-"));
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = search.trim()
    ? FA_ICONS.filter(ico => ico.includes(search.toLowerCase()))
    : FA_ICONS;

  return (
    <div ref={pickerRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger button - shows current icon */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 4,
          background: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "monospace",
          minWidth: 140,
        }}
      >
        {isCustom ? (
          <img src={value} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
        ) : (
          <i className={`fas ${value}`} style={{ width: 18, textAlign: "center", fontSize: 14 }} />
        )}
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {isCustom ? "Custom" : value}
        </span>
        <span style={{ fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown / Search panel */}
      {open && (
        <div
          style={{
            position: "absolute", top: "100%", left: 0, zIndex: 999,
            width: 340, maxHeight: 360,
            background: "#fff", borderRadius: 8,
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)", border: "1px solid #e5e7eb",
            marginTop: 4, display: "flex", flexDirection: "column",
          }}
        >
          {/* Search + Upload */}
          <div style={{ padding: "8px", borderBottom: "1px solid #f0f0f0", display: "flex", gap: 6 }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search icons..."
              autoFocus
              style={{
                flex: 1, padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 4,
                fontSize: 13, outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Upload custom icon"
              style={{
                padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 4,
                background: "#fff", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap",
              }}
            >
              📁 Upload
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={async (e: any) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const fd = new FormData();
                fd.append("file", f);
                try {
                  const res = await fetch("/api/media/", { method: "POST", body: fd });
                  if (res.ok) { const m = await res.json(); onChange(m.url); setOpen(false); }
                } catch {}
              }}
            />
          </div>

          {/* Icon grid */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
            {filtered.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: 20 }}>
                No icons found
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
                {filtered.map((ico) => {
                  const active = value === ico;
                  return (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => { onChange(ico); setIsCustom(false); setOpen(false); }}
                      title={ico}
                      style={{
                        padding: "8px 4px", border: active ? "2px solid #2563eb" : "1px solid transparent",
                        borderRadius: 6, background: active ? "#eff6ff" : "transparent",
                        cursor: "pointer", fontSize: 16, textAlign: "center",
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                    >
                      <i className={`fas ${ico}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected info */}
          <div style={{ padding: "6px 8px", borderTop: "1px solid #f0f0f0", fontSize: 11, color: "#94a3b8" }}>
            {isCustom ? "Custom uploaded icon" : `fas ${value}`}
          </div>
        </div>
      )}
    </div>
  );
}
