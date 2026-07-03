"use client";

import { useEffect, useState, useRef } from "react";
import { ImageUploadCard, InputField, SaveButton } from "@/components/admin/SettingsShared";
import MediaBrowser from "@/components/admin/MediaBrowser";

export default function BrandingSettings() {
  const [form, setForm] = useState({ logo_url: "", logo_width: "", favicon_url: "", facebook_url: "", twitter_url: "", instagram_url: "", linkedin_url: "", youtube_url: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, favicon: false });
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [mediaField, setMediaField] = useState("");

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      setForm({
        logo_url: data.logo_url || "",
        logo_width: data.logo_width || "160",
        favicon_url: data.favicon_url || "",
        facebook_url: data.facebook_url || "",
        twitter_url: data.twitter_url || "",
        instagram_url: data.instagram_url || "",
        linkedin_url: data.linkedin_url || "",
        youtube_url: data.youtube_url || "",
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
  };

  const uploadImage = async (field: string, file: File) => {
    const key = field === "logo_url" ? "logo" : "favicon";
    setUploading(prev => ({ ...prev, [key]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "image");
      const res = await fetch("/api/media", { method: "POST", body: formData });
      if (res.ok) {
        const media = await res.json();
        // Store WebP URL for performance (browser auto-falls back)
        const webpUrl = media.webpUrl || media.url;
        setForm(prev => ({ ...prev, [field]: webpUrl }));
        await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: webpUrl }) });
      }
    } catch (err) { console.error(err); }
    finally { setUploading(prev => ({ ...prev, [key]: false })); }
  };

  const selectFromMedia = (url: string) => {
    setForm(prev => ({ ...prev, [mediaField]: url }));
    setShowMediaBrowser(false);
  };

  if (loading) return <p style={{ color: "#6b7280" }}>Loading...</p>;

  return (
    <div>
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>Branding</h2>

        {/* Site Logo */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Site Logo</label>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{
              width: form.logo_width ? parseInt(form.logo_width) : 160,
              height: 48, borderRadius: 8, border: "2px dashed #d1d5db",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", background: "#f9fafb", flexShrink: 0,
            }}>
              {form.logo_url ? (
                <img src={form.logo_url} alt="Site Logo"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <span style={{ fontSize: 12, color: "#9ca3af" }}>None</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <ImageUploadField onUpload={(f) => uploadImage("logo_url", f)} uploading={uploading.logo} />
                <button onClick={() => { setMediaField("logo_url"); setShowMediaBrowser(true); }}
                  style={{ padding: "6px 16px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 }}>
                  📁 Media
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>Width (px):</label>
                <input type="number" value={form.logo_width}
                  onChange={e => setForm({ ...form, logo_width: e.target.value })}
                  style={{ width: 80, padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13 }}
                  min="40" max="400" />
              </div>
              {form.logo_url && (
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                  {form.logo_url.endsWith(".webp") ? "🌐 WebP" : "📷 Original"} · Auto-saves on upload
                </div>
              )}
            </div>
          </div>
        </div>

        <ImageUploadCard label="Favicon (48×48 PNG)" field="favicon_url" currentUrl={form.favicon_url}
          onUpload={uploadImage} uploading={uploading.favicon} />

        {/* Social Media */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#374151" }}>Social Media Links</h3>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>Used in the footer Social Icons column.</p>
          <div style={{ display: "grid", gap: 8 }}>
            {[
              { key: "facebook_url", icon: "📘", label: "Facebook URL" },
              { key: "twitter_url", icon: "🐦", label: "Twitter / X URL" },
              { key: "instagram_url", icon: "📷", label: "Instagram URL" },
              { key: "linkedin_url", icon: "💼", label: "LinkedIn URL" },
              { key: "youtube_url", icon: "▶️", label: "YouTube URL" },
            ].map(({ key, icon, label }) => (
              <InputField key={key} label={`${icon} ${label}`} value={(form as any)[key]}
                onChange={v => setForm({ ...form, [key]: v })} />
            ))}
          </div>
        </div>

        <SaveButton saving={saving} onClick={save} />
      </div>

      {/* Media Browser Modal */}
      {showMediaBrowser && (
        <MediaBrowser onSelect={selectFromMedia} onClose={() => setShowMediaBrowser(false)} />
      )}
    </div>
  );
}

function ImageUploadField({ onUpload, uploading }: { onUpload: (f: File) => void; uploading: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); if (ref.current) ref.current.value = ""; }} />
      <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
        style={{ padding: "6px 16px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: uploading ? "wait" : "pointer", fontSize: 13 }}>
        {uploading ? "⏳ Uploading..." : "Upload Image"}
      </button>
    </>
  );
}
