"use client";

import { useEffect, useState } from "react";
import { InputField, SaveButton } from "@/components/admin/SettingsShared";

const FIELDS = [
  { key: "site_name", label: "Website Name", hint: "My Company" },
  { key: "site_tagline", label: "Tagline", hint: "Your trusted partner for quality products." },
  { key: "site_description", label: "Meta Description (SEO)", hint: "Brief description for search engines" },
  { key: "admin_brand", label: "Admin Panel Brand Name", hint: "Admin Panel" },
  { key: "product_label", label: "Product Label (public facing)", hint: "Products" },
  { key: "product_slug", label: "Product Route Slug", hint: "products → /products/" },
  { key: "category_slug", label: "Category Route Slug", hint: "categories → /categories/round/" },
  { key: "inquiry_button_text", label: "Inquiry Button Text", hint: "SEND INQUIRY" },
  { key: "primary_color", label: "Primary Theme Color (hex)", hint: "#065f46" },
  { key: "back_to_catalog_text", label: "Back to Catalog Link Text", hint: "Back to Catalog" },
  { key: "specs_label", label: "Specifications Section Label", hint: "Specifications" },
];

export default function GeneralSettings() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      const defaults: Record<string, string> = {};
      FIELDS.forEach(f => { defaults[f.key] = data[f.key] || ""; });
      defaults.noindex = data.noindex || "false";
      setForm(defaults);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
  };

  if (loading) return <p style={{ color: "#6b7280" }}>Loading...</p>;

  return (
    <div>
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>🏢 Site Identity</h2>
        {FIELDS.slice(0, 4).map(f => (
          <InputField key={f.key} label={f.label} value={form[f.key] || ""}
            onChange={v => setForm({ ...form, [f.key]: v })} placeholder={f.hint} />
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>📦 Product Pages</h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          Configure how products are displayed and what labels to use. <strong>Warning:</strong> Changing route slugs may break existing links.
        </p>
        {FIELDS.slice(4).map(f => (
          <InputField key={f.key} label={f.label} value={form[f.key] || ""}
            onChange={v => setForm({ ...form, [f.key]: v })} placeholder={f.hint} />
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>🔒 Search Engine Visibility</h2>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 14 }}>
          <input type="checkbox" checked={form.noindex === "true"}
            onChange={e => setForm({ ...form, noindex: e.target.checked ? "true" : "false" })}
            style={{ marginTop: 2, width: 16, height: 16, accentColor: "#2563eb", cursor: "pointer" }} />
          <div>
            <div style={{ fontWeight: 500, color: "#374151" }}>Discourage search engines from indexing this site</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
              Adds a &lt;meta name=&quot;robots&quot; content=&quot;noindex&quot;&gt; tag to all pages.
              Use this when the site is under construction or not ready for public indexing.
              Google and other search engines will respect this directive.
            </div>
          </div>
        </label>
      </div>

      <SaveButton saving={saving} onClick={save} />
    </div>
  );
}
