"use client";

import { useEffect, useState } from "react";
import { InputField, SaveButton } from "@/components/admin/SettingsShared";

interface FooterColumn {
  id: string;
  title: string;
  type: "text" | "links" | "contact" | "social";
  content?: string;
  items?: { label: string; url: string }[];
}

function genId() { return Math.random().toString(36).slice(2, 8); }

const DEFAULT_COLUMNS: FooterColumn[] = [
  { id: genId(), title: "About Us", type: "text", content: "Professional manufacturer with years of experience serving global clients." },
  { id: genId(), title: "Quick Links", type: "links", items: [{ label: "Home", url: "/" }, { label: "Products", url: "/products" }, { label: "About", url: "/about" }, { label: "Contact", url: "/contact" }] },
  { id: genId(), title: "Contact", type: "contact" },
  { id: genId(), title: "Follow Us", type: "social" },
];

export default function FooterSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [columns, setColumns] = useState<FooterColumn[]>([]);
  const [footerText, setFooterText] = useState("");

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      try {
        const parsed = JSON.parse(data.footer_columns || "[]");
        if (Array.isArray(parsed) && parsed.length > 0) setColumns(parsed);
        else setColumns(DEFAULT_COLUMNS);
      } catch { setColumns(DEFAULT_COLUMNS); }
      setFooterText(data.footer_text || "");
      setLoading(false);
    }).catch(() => { setColumns(DEFAULT_COLUMNS); setLoading(false); });
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ footer_columns: JSON.stringify(columns), footer_text: footerText }),
    });
    setSaving(false);
  }

  function addColumn() {
    setColumns([...columns, { id: genId(), title: "", type: "text", content: "", items: [] }]);
  }

  function updateColumn(id: string, updates: Partial<FooterColumn>) {
    setColumns(columns.map(c => c.id === id ? { ...c, ...updates } : c));
  }

  function removeColumn(id: string) {
    setColumns(columns.filter(c => c.id !== id));
  }

  function addLink(colId: string) {
    setColumns(columns.map(c => c.id === colId ? { ...c, items: [...(c.items || []), { label: "", url: "/" }] } : c));
  }

  function updateLink(colId: string, idx: number, updates: Partial<{ label: string; url: string }>) {
    setColumns(columns.map(c =>
      c.id === colId ? { ...c, items: c.items?.map((li, i) => i === idx ? { ...li, ...updates } : li) } : c
    ));
  }

  function removeLink(colId: string, idx: number) {
    setColumns(columns.map(c =>
      c.id === colId ? { ...c, items: c.items?.filter((_, i) => i !== idx) } : c
    ));
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "#374151" }}>📋 Footer Columns</h2>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Each column appears side by side in the footer. Customize content for each.
      </p>

      {columns.map((col) => (
        <div key={col.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 4, display: "block" }}>Column Title</label>
              <input type="text" value={col.title} onChange={e => updateColumn(col.id, { title: e.target.value })}
                placeholder="Column title" style={inputS} />
            </div>
            <div style={{ minWidth: 120 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 4, display: "block" }}>Type</label>
              <select value={col.type} onChange={e => updateColumn(col.id, { type: e.target.value as any })}
                style={{ ...inputS, padding: "6px 8px" }}>
                <option value="text">Text</option>
                <option value="links">Links</option>
                <option value="contact">Contact Info</option>
                <option value="social">Social Icons</option>
              </select>
            </div>
            <button type="button" onClick={() => removeColumn(col.id)}
              style={{ padding: "6px 12px", border: "1px solid #fca5a5", borderRadius: 6, background: "#fff", color: "#dc2626", fontSize: 12, cursor: "pointer", marginTop: 20 }}>
              🗑️
            </button>
          </div>

          {col.type === "text" && (
            <textarea value={col.content || ""} onChange={e => updateColumn(col.id, { content: e.target.value })}
              placeholder="Text content..." rows={3} style={{ ...inputS, fontFamily: "inherit" }} />
          )}

          {col.type === "links" && (
            <div>
              {(col.items || []).map((link, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <input type="text" value={link.label} onChange={e => updateLink(col.id, i, { label: e.target.value })}
                    placeholder="Label" style={{ flex: 1, ...inputS }} />
                  <input type="text" value={link.url} onChange={e => updateLink(col.id, i, { url: e.target.value })}
                    placeholder="URL" style={{ flex: 1, ...inputS }} />
                  <button type="button" onClick={() => removeLink(col.id, i)}
                    style={{ padding: "4px 8px", border: "1px solid #e5e7eb", borderRadius: 4, background: "#fff", cursor: "pointer", fontSize: 12, color: "#dc2626" }}>✕</button>
                </div>
              ))}
              <button type="button" onClick={() => addLink(col.id)}
                style={{ padding: "4px 12px", border: "1px dashed #94a3b8", borderRadius: 4, background: "transparent", fontSize: 12, cursor: "pointer", color: "#64748b" }}>
                + Add Link
              </button>
            </div>
          )}

          {col.type === "contact" && (
            <div style={{ fontSize: 13, color: "#6b7280", fontStyle: "italic" }}>
              Automatically shows contact info from Contact Info settings.
            </div>
          )}

          {col.type === "social" && (
            <div style={{ fontSize: 13, color: "#6b7280", fontStyle: "italic" }}>
              Shows social media icons. Configure in Branding settings.
            </div>
          )}
        </div>
      ))}

      <button type="button" onClick={addColumn}
        style={{ padding: "8px 16px", border: "2px dashed #94a3b8", borderRadius: 8, background: "transparent", cursor: "pointer", fontSize: 13, color: "#64748b", marginBottom: 16, width: "100%" }}>
        + Add Column
      </button>

      <InputField label="Footer Bottom Text" value={footerText} onChange={setFooterText} placeholder="© 2024 Your Company. All rights reserved." />

      <SaveButton saving={saving} onClick={save} />
    </div>
  );
}

const inputS: React.CSSProperties = {
  width: "100%", padding: "6px 10px", border: "1px solid #d1d5db",
  borderRadius: 6, fontSize: 13, boxSizing: "border-box",
};
