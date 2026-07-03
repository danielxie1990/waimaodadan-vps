"use client";

import { useEffect, useState } from "react";
import { InputField, SaveButton } from "@/components/admin/SettingsShared";

export default function HeaderSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    header_layout: "logo-left",
    sticky_header: "false",
    header_bg: "",
    header_text_color: "",
    header_transparent: "false",
    header_border: "true",
    top_bar_text: "",
    top_bar_enabled: "false",
    top_bar_bg: "",
    top_bar_color: "",
    top_bar_height: "",
    enable_lang_switcher: "true",
    show_cta_button: "true",
    cta_text: "Contact Us",
    cta_url: "/contact",
    header_height: "80",
  });

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      setForm({
        header_layout: data.header_layout || "logo-left",
        sticky_header: data.sticky_header || "false",
        header_bg: data.header_bg || "",
        header_text_color: data.header_text_color || "",
        header_transparent: data.header_transparent || "false",
        header_border: data.header_border ?? "true",
        top_bar_text: data.top_bar_text || "",
        top_bar_enabled: data.top_bar_enabled || "false",
        top_bar_bg: data.top_bar_bg || "",
        top_bar_color: data.top_bar_color || "",
        top_bar_height: data.top_bar_height || "",
        enable_lang_switcher: data.enable_lang_switcher ?? "true",
        show_cta_button: data.show_cta_button ?? "true",
        cta_text: data.cta_text || "Get Quote",
        cta_url: data.cta_url || "/contact",
        header_height: data.header_height || "80",
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
  }

  if (loading) return <p>Loading...</p>;

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#374151",
  };

  return (
    <div>
      {/* ── Layout ── */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>🖥️ Layout</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Header Layout</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { value: "logo-left", label: "Logo Left" },
              { value: "logo-center", label: "Logo Center" },
              { value: "stacked", label: "Stacked" },
            ].map(opt => (
              <button key={opt.value} type="button" onClick={() => setForm({ ...form, header_layout: opt.value })}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: 8, cursor: "pointer", textAlign: "center",
                  border: form.header_layout === opt.value ? "2px solid #3b82f6" : "2px solid #e5e7eb",
                  background: form.header_layout === opt.value ? "#eff6ff" : "#fff",
                  fontSize: 13, fontWeight: form.header_layout === opt.value ? 600 : 400,
                  color: form.header_layout === opt.value ? "#2563eb" : "#374151",
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={form.sticky_header === "true"}
              onChange={e => setForm({ ...form, sticky_header: e.target.checked ? "true" : "false" })} />
            Sticky Header (fixed on scroll)
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={form.header_transparent === "true"}
              onChange={e => setForm({ ...form, header_transparent: e.target.checked ? "true" : "false" })} />
            Transparent Header (no background, overlay)
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={form.top_bar_enabled === "true"}
              onChange={e => setForm({ ...form, top_bar_enabled: e.target.checked ? "true" : "false" })} />
            Show Top Bar
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={form.header_border === "true"}
              onChange={e => setForm({ ...form, header_border: e.target.checked ? "true" : "false" })} />
            Bottom Border
          </label>
        </div>

        {form.top_bar_enabled === "true" && (
          <>
          <InputField label="Top Bar Text" value={form.top_bar_text}
            onChange={v => setForm({ ...form, top_bar_text: v })}
            placeholder="Free shipping worldwide!" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Background Color</label>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="color" value={form.top_bar_bg || "#1e293b"}
                  onChange={e => setForm({ ...form, top_bar_bg: e.target.value })}
                  style={{ width: 34, height: 34, padding: 0, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }} />
                <input type="text" value={form.top_bar_bg} placeholder="#1e293b"
                  onChange={e => setForm({ ...form, top_bar_bg: e.target.value })}
                  style={{ flex: 1, padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }} />
                <button onClick={() => setForm({ ...form, top_bar_bg: "" })}
                  style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", fontSize: 11, cursor: "pointer" }}>Reset</button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Text Color</label>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="color" value={form.top_bar_color || "#ffffff"}
                  onChange={e => setForm({ ...form, top_bar_color: e.target.value })}
                  style={{ width: 34, height: 34, padding: 0, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }} />
                <input type="text" value={form.top_bar_color} placeholder="#ffffff"
                  onChange={e => setForm({ ...form, top_bar_color: e.target.value })}
                  style={{ flex: 1, padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }} />
                <button onClick={() => setForm({ ...form, top_bar_color: "" })}
                  style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", fontSize: 11, cursor: "pointer" }}>Reset</button>
              </div>
            </div>
            <InputField label="Height (px)" value={form.top_bar_height}
              onChange={v => setForm({ ...form, top_bar_height: v })}
              placeholder="8 (default)" />
          </div>
          </>
        )}

        <InputField label="Header Height (px)" value={form.header_height}
          onChange={v => setForm({ ...form, header_height: v })} placeholder="80" />
      </div>

      {/* ── Style ── */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>🎨 Header Style</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Background Color</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="color" value={form.header_bg || "#ffffff"}
                onChange={e => setForm({ ...form, header_bg: e.target.value })}
                style={{ width: 40, height: 40, padding: 0, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }} />
              <input type="text" value={form.header_bg} placeholder="#ffffff"
                onChange={e => setForm({ ...form, header_bg: e.target.value })}
                style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }} />
              <button onClick={() => setForm({ ...form, header_bg: "" })}
                style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", fontSize: 12, cursor: "pointer" }}>
                Reset
              </button>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Leave empty for default white.</div>
          </div>

          <div>
            <label style={labelStyle}>Text / Link Color</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="color" value={form.header_text_color || "#333333"}
                onChange={e => setForm({ ...form, header_text_color: e.target.value })}
                style={{ width: 40, height: 40, padding: 0, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }} />
              <input type="text" value={form.header_text_color} placeholder="#333333"
                onChange={e => setForm({ ...form, header_text_color: e.target.value })}
                style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }} />
              <button onClick={() => setForm({ ...form, header_text_color: "" })}
                style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", fontSize: 12, cursor: "pointer" }}>
                Reset
              </button>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Leave empty for default dark text.</div>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>🔘 Header Actions</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={form.enable_lang_switcher === "true"}
              onChange={e => setForm({ ...form, enable_lang_switcher: e.target.checked ? "true" : "false" })} />
            Show Language Switcher
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={form.show_cta_button === "true"}
              onChange={e => setForm({ ...form, show_cta_button: e.target.checked ? "true" : "false" })} />
            Show CTA Button
          </label>
        </div>
        {form.show_cta_button === "true" && (
          <>
            <InputField label="CTA Button Text" value={form.cta_text} onChange={v => setForm({ ...form, cta_text: v })} />
            <InputField label="CTA Button URL" value={form.cta_url} onChange={v => setForm({ ...form, cta_url: v })} />
          </>
        )}
      </div>

      <SaveButton saving={saving} onClick={save} />
    </div>
  );
}
