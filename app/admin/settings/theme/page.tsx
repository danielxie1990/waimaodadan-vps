"use client";

import { useEffect, useState } from "react";
import { InputField, SaveButton } from "@/components/admin/SettingsShared";

const COLOR_PRESETS = [
  { name: "Professional Red", colors: { primary: "#b22222", primaryDark: "#8b0000", primaryLight: "#ef4444", secondary: "#1e293b", accent: "#d4af37" } },
  { name: "Sky Blue", colors: { primary: "#2563eb", primaryDark: "#1d4ed8", primaryLight: "#60a5fa", secondary: "#0f172a", accent: "#f59e0b" } },
  { name: "Forest Green", colors: { primary: "#059669", primaryDark: "#047857", primaryLight: "#34d399", secondary: "#1e293b", accent: "#d4af37" } },
  { name: "Dark Elegance", colors: { primary: "#1e293b", primaryDark: "#0f172a", primaryLight: "#475569", secondary: "#b22222", accent: "#d4af37" } },
  { name: "Minimal Gray", colors: { primary: "#374151", primaryDark: "#111827", primaryLight: "#6b7280", secondary: "#2563eb", accent: "#f59e0b" } },
];

const FONT_OPTIONS = [
  { label: "System Default", value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { label: "Inter", value: "'Inter', -apple-system, sans-serif" },
  { label: "Noto Sans SC (中文)", value: "'Noto Sans SC', -apple-system, sans-serif" },
  { label: "Georgia (Serif)", value: "Georgia, 'Times New Roman', serif" },
  { label: "Helvetica Neue", value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
];

const BORDER_RADIUS_OPTIONS = [
  { label: "Sharp (0px)", value: "0px" },
  { label: "Small (4px)", value: "4px" },
  { label: "Medium (8px)", value: "8px" },
  { label: "Large (12px)", value: "12px" },
  { label: "Rounded (24px)", value: "24px" },
];

export default function ThemeSettings() {
  const [form, setForm] = useState({
    theme_primary_color: "",
    theme_primary_dark: "",
    theme_primary_light: "",
    theme_secondary_color: "",
    theme_secondary_dark: "",
    theme_accent_color: "",
    theme_font_family: "",
    theme_border_radius: "",
    theme_button_style: "filled",
    theme_container_width: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      setForm({
        theme_primary_color: data.theme_primary_color || "",
        theme_primary_dark: data.theme_primary_dark || "",
        theme_primary_light: data.theme_primary_light || "",
        theme_secondary_color: data.theme_secondary_color || "",
        theme_secondary_dark: data.theme_secondary_dark || "",
        theme_accent_color: data.theme_accent_color || "",
        theme_font_family: data.theme_font_family || "",
        theme_border_radius: data.theme_border_radius || "",
        theme_button_style: data.theme_button_style || "filled",
        theme_container_width: data.theme_container_width || "",
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setPreviewKey(k => k + 1);
  }

  function applyPreset(preset: typeof COLOR_PRESETS[0]) {
    setForm(prev => ({
      ...prev,
      theme_primary_color: preset.colors.primary,
      theme_primary_dark: preset.colors.primaryDark,
      theme_primary_light: preset.colors.primaryLight,
      theme_secondary_color: preset.colors.secondary,
      theme_accent_color: preset.colors.accent,
    }));
  }

  // Build live preview style
  const previewStyle = {
    "--primary": form.theme_primary_color || "#b22222",
    "--primary-dark": form.theme_primary_dark || "#8b0000",
    "--primary-light": form.theme_primary_light || "#ef4444",
    "--secondary": form.theme_secondary_color || "#1e293b",
    "--accent": form.theme_accent_color || "#d4af37",
    "--font-family": form.theme_font_family || "-apple-system, sans-serif",
    "--border-radius": form.theme_border_radius || "4px",
    "--button-style": form.theme_button_style || "filled",
  } as React.CSSProperties;

  if (loading) return <p style={{ color: "#6b7280" }}>Loading...</p>;

  const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" };

  return (
    <div>
      {/* Color Presets */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>🎨 Quick Color Presets</h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>Pick a preset to instantly change the color scheme.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COLOR_PRESETS.map(p => (
            <button key={p.name} type="button" onClick={() => applyPreset(p)}
              style={{ padding: "8px 14px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{ width: 16, height: 16, borderRadius: 3, background: p.colors.primary, display: "inline-block" }} />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>🎯 Brand Colors</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { key: "theme_primary_color", label: "Primary Color", hint: "#b22222", swatch: true },
            { key: "theme_primary_dark", label: "Primary (Dark)", hint: "#8b0000", swatch: true },
            { key: "theme_primary_light", label: "Primary (Light)", hint: "#ef4444", swatch: true },
            { key: "theme_secondary_color", label: "Secondary Color", hint: "#1e293b", swatch: true },
            { key: "theme_secondary_dark", label: "Secondary (Dark)", hint: "#0f172a", swatch: true },
            { key: "theme_accent_color", label: "Accent Color", hint: "#d4af37", swatch: true },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 8 }}>
              <label style={labelStyle}>{f.label}</label>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {f.swatch && (
                  <span style={{
                    width: 32, height: 32, borderRadius: 4, flexShrink: 0,
                    background: (form as any)[f.key] || f.hint || "#ccc",
                    border: "1px solid #d1d5db",
                  }} />
                )}
                <input type="text" value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.hint}
                  style={{ flex: 1, padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, fontFamily: "monospace" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography & Layout */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>📐 Typography & Layout</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Font Family</label>
          <select value={form.theme_font_family} onChange={e => setForm({ ...form, theme_font_family: e.target.value })}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}>
            <option value="">System Default</option>
            {FONT_OPTIONS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Border Radius</label>
          <div style={{ display: "flex", gap: 6 }}>
            {BORDER_RADIUS_OPTIONS.map(o => (
              <button key={o.value} type="button" onClick={() => setForm({ ...form, theme_border_radius: o.value })}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13,
                  border: form.theme_border_radius === o.value ? "2px solid #3b82f6" : "1px solid #d1d5db",
                  background: form.theme_border_radius === o.value ? "#eff6ff" : "#fff",
                  fontWeight: form.theme_border_radius === o.value ? 600 : 400,
                }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Button Style</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { value: "filled", label: "Filled" },
              { value: "outlined", label: "Outlined" },
              { value: "ghost", label: "Ghost (minimal)" },
            ].map(o => (
              <button key={o.value} type="button" onClick={() => setForm({ ...form, theme_button_style: o.value })}
                style={{
                  padding: "8px 20px", borderRadius: 6, cursor: "pointer", fontSize: 13,
                  border: form.theme_button_style === o.value ? "2px solid #3b82f6" : "1px solid #d1d5db",
                  background: form.theme_button_style === o.value ? "#eff6ff" : "#fff",
                  fontWeight: form.theme_button_style === o.value ? 600 : 400,
                }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <InputField label="Container Max Width" value={form.theme_container_width}
          onChange={v => setForm({ ...form, theme_container_width: v })} placeholder="1200px" />
      </div>

      {/* Live Preview */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }} key={previewKey}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>👁️ Live Preview</h2>
        <div style={{
          border: "1px solid var(--border)", borderRadius: 8, padding: 24,
          fontFamily: "var(--font-family)",
        }}>
          <div style={previewStyle}>
            <div style={{
              background: "var(--primary)", color: "#fff", padding: "12px 24px",
              borderRadius: "var(--border-radius)", display: "inline-block", marginRight: 8, marginBottom: 8,
              border: "2px solid var(--primary)",
            }}>
              Primary Button
            </div>
            <div style={{
              background: "transparent", color: "var(--primary)", padding: "12px 24px",
              borderRadius: "var(--border-radius)", display: "inline-block", marginRight: 8, marginBottom: 8,
              border: "2px solid var(--primary)",
            }}>
              Outlined Button
            </div>
            <div style={{
              background: "var(--secondary)", color: "#fff", padding: "12px 24px",
              borderRadius: "var(--border-radius)", display: "inline-block", marginBottom: 8,
              border: "2px solid var(--secondary)",
            }}>
              Secondary Button
            </div>
            <p style={{ marginTop: 12, fontSize: 14, color: "var(--text-light)" }}>
              This preview shows how your colors will look on buttons and text.
            </p>
          </div>
        </div>
      </div>

      <SaveButton saving={saving} onClick={save} />
    </div>
  );
}
