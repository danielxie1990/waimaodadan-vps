"use client";

import { useState, useRef } from "react";
import type { SectionBlock } from "@/lib/block-types";
import MediaBrowser from "./MediaBrowser";

type Tab = "layout" | "style" | "advanced";

interface Props {
  section: SectionBlock;
  onChange: (updated: SectionBlock) => void;
  onClose: () => void;
}

const inputS: React.CSSProperties = {
  width: "100%", padding: "6px 10px", border: "1px solid #d1d5db",
  borderRadius: 6, fontSize: 13, boxSizing: "border-box",
};

const labelS: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 4,
};

const btnTab = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: "8px 0", border: "none", cursor: "pointer",
  fontSize: 13, fontWeight: 500,
  background: active ? "#3b82f6" : "#f3f4f6",
  color: active ? "#fff" : "#6b7280",
  borderRadius: 6,
});

export default function SectionSettingsPanel({ section, onChange, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("layout");

  function update(key: string, value: any) {
    onChange({ ...section, [key]: value || undefined });
  }

  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
      marginBottom: 8, overflow: "hidden",
    }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "8px 8px 0", background: "#f8fafc" }}>
        <button type="button" onClick={() => setTab("layout")} style={btnTab(tab === "layout")}>📐 Layout</button>
        <button type="button" onClick={() => setTab("style")} style={btnTab(tab === "style")} >🎨 Style</button>
        <button type="button" onClick={() => setTab("advanced")} style={btnTab(tab === "advanced")}>⚙️ Advanced</button>
      </div>

      {/* Tab content */}
      <div style={{ padding: 12, maxHeight: 300, overflow: "auto" }}>
        {tab === "layout" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Content Width */}
            <div>
              <label style={labelS}>Content Width</label>
              <div style={{ display: "flex", gap: 6 }}>
                {[["boxed", "Boxed"], ["fullwidth", "Full Width"]].map(([val, label]) => (
                  <button key={val} type="button"
                    onClick={() => update("contentWidth", val)}
                    style={{
                      flex: 1, padding: "6px 0", border: "1px solid",
                      borderRadius: 6, cursor: "pointer", fontSize: 12,
                      background: (section.contentWidth || "boxed") === val ? "#eff6ff" : "#fff",
                      borderColor: (section.contentWidth || "boxed") === val ? "#3b82f6" : "#d1d5db",
                      color: (section.contentWidth || "boxed") === val ? "#2563eb" : "#64748b",
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* Min Height */}
            <div>
              <label style={labelS}>Minimum Height (px)</label>
              <input type="number" value={section.minHeight || ""}
                onChange={e => update("minHeight", e.target.value || "")}
                placeholder="Leave empty for auto" style={inputS} />
            </div>
            {/* Vertical Align */}
            <div>
              <label style={labelS}>Vertical Alignment</label>
              <select value={section.verticalAlign || "top"}
                onChange={e => {
                  const val = e.target.value;
                  // Auto-set a minHeight when center/bottom is selected so justifyContent has space to work
                  if ((val === "center" || val === "bottom") && !section.minHeight) {
                    onChange({ ...section, verticalAlign: val, minHeight: "400" });
                  } else {
                    update("verticalAlign", val);
                  }
                }}
                style={inputS}>
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
              {(section.verticalAlign === "center" || section.verticalAlign === "bottom") && (
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                  Minimum Height auto-set. Adjust above as needed.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "style" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Background Type */}
            <div>
              <label style={labelS}>Background Type</label>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[["solid", "🎨 Solid"], ["image", "🖼️ Image"], ["gradient", "🌈 Gradient"]].map(([val, label]) => (
                  <button key={val} type="button"
                    onClick={() => update("bgType", val)}
                    style={{
                      padding: "6px 14px", border: "1px solid", borderRadius: 6,
                      cursor: "pointer", fontSize: 12, whiteSpace: "nowrap",
                      background: (section.bgType || "solid") === val ? "#eff6ff" : "#fff",
                      borderColor: (section.bgType || "solid") === val ? "#3b82f6" : "#d1d5db",
                      color: (section.bgType || "solid") === val ? "#2563eb" : "#64748b",
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Solid Color */}
            {(section.bgType || "solid") === "solid" && (
              <div>
                <label style={labelS}>Background Color</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="color" value={section.bgColor || "#ffffff"}
                    onChange={e => update("bgColor", e.target.value)}
                    style={{ width: 40, height: 40, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }} />
                  <input type="text" value={section.bgColor || ""}
                    onChange={e => update("bgColor", e.target.value)}
                    placeholder="#ffffff" style={inputS} />
                </div>
              </div>
            )}

            {/* Image */}
            {section.bgType === "image" && (
              <>
                <div>
                  <label style={labelS}>Background Image</label>
                  <BgImagePicker value={section.bgImage || ""} onChange={(v) => update("bgImage", v)} />
                </div>
                <div>
                  <label style={labelS}>Overlay Color</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="color" value={section.bgOverlay || "#000000"}
                      onChange={e => update("bgOverlay", e.target.value || "")}
                      style={{ width: 40, height: 40, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }} />
                    <input type="text" value={section.bgOverlay || ""}
                      onChange={e => update("bgOverlay", e.target.value)}
                      placeholder="#000000" style={inputS} />
                  </div>
                </div>
                <div>
                  <label style={labelS}>Overlay Opacity (0-100)</label>
                  <input type="number" min="0" max="100"
                    value={section.bgOverlayOpacity || ""}
                    onChange={e => update("bgOverlayOpacity", e.target.value)}
                    placeholder="50" style={inputS} />
                </div>
              </>
            )}

            {/* Gradient */}
            {section.bgType === "gradient" && (
              <div>
                <label style={labelS}>CSS Gradient</label>
                <input type="text" value={section.bgGradient || ""}
                  onChange={e => update("bgGradient", e.target.value)}
                  placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  style={inputS} />
                {section.bgGradient && (
                  <div style={{
                    height: 60, borderRadius: 6, marginTop: 8,
                    background: section.bgGradient,
                    border: "1px solid #e2e8f0",
                  }} />
                )}
              </div>
            )}
          </div>
        )}

        {tab === "advanced" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 4 }}>Padding (px)</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={labelS}>Top</label>
                <input type="number" value={section.paddingTop || ""}
                  onChange={e => update("paddingTop", e.target.value || "")}
                  placeholder="0" style={inputS} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelS}>Bottom</label>
                <input type="number" value={section.paddingBottom || ""}
                  onChange={e => update("paddingBottom", e.target.value || "")}
                  placeholder="0" style={inputS} />
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 4 }}>Margin (px)</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={labelS}>Top</label>
                <input type="number" value={section.marginTop || ""}
                  onChange={e => update("marginTop", e.target.value || "")}
                  placeholder="0" style={inputS} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelS}>Bottom</label>
                <input type="number" value={section.marginBottom || ""}
                  onChange={e => update("marginBottom", e.target.value || "")}
                  placeholder="0" style={inputS} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Close */}
      <div style={{ textAlign: "right", padding: "8px 12px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <button type="button" onClick={onClose}
          style={{ padding: "6px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
          Done
        </button>
      </div>
    </div>
  );
}

// ── Background Image Picker (upload + browse media) ──
function BgImagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showBrowser, setShowBrowser] = useState(false);

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/media/", { method: "POST", body: fd });
    if (res.ok) {
      const m = await res.json();
      onChange(m.url);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="text" value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://... or click Browse"
          style={{ flex: 1, padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }} />
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) { uploadFile(f); if (fileRef.current) fileRef.current.value = ""; } }} />
        <button type="button" onClick={() => fileRef.current?.click()}
          style={{ padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>
          📁 Upload
        </button>
        <button type="button" onClick={() => setShowBrowser(true)}
          style={{ padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 6, background: "#f8fafc", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>
          🖼️ Browse
        </button>
      </div>
      {value && (
        <div style={{ marginTop: 8, height: 80, borderRadius: 6, overflow: "hidden", border: "1px solid #e2e8f0" }}>
          <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      {showBrowser && (
        <MediaBrowser
          onSelect={(url) => { onChange(url); setShowBrowser(false); }}
          onClose={() => setShowBrowser(false)}
        />
      )}
    </div>
  );
}
