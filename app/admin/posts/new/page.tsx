"use client";

import { useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/admin/RichEditor";

export default function NewPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", content: "", excerpt: "", metaTitle: "", metaDesc: "", image: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  function slugify(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, image: form.image, published: false }),
    });

    setSaving(false);
    if (res.ok) router.push("/admin/posts");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6,
    fontSize: 14, boxSizing: "border-box",
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>New Blog Post</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 900 }}>
        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>文章信息</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input type="text" value={form.title} onChange={e => { setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) }); }} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Slug *</label>
              <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Excerpt（文章摘要）</label>
            <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={3}
              style={{ ...inputStyle, fontFamily: "inherit" }} />
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          {/* Featured image */}
          <div style={{ marginBottom: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 8, background: "#fafbfc" }}>
            <label style={labelStyle}>Featured Image</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {form.image ? (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img src={form.image} alt="" style={{ height: 80, borderRadius: 4, objectFit: "cover" }} />
                  <button type="button" onClick={() => setForm({ ...form, image: "" })}
                    style={{ position: "absolute", top: -6, right: -6, padding: "2px 6px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 10 }}>✕</button>
                </div>
              ) : (
                <span style={{ fontSize: 13, color: "#9ca3af" }}>No image</span>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={async (e: any) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const fd = new FormData(); fd.append("file", f);
                    const res = await fetch("/api/media/", { method: "POST", body: fd });
                    if (res.ok) { const m = await res.json(); setForm({ ...form, image: m.url }); }
                  }
                }} />
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer", fontSize: 12 }}>📁 Upload</button>
              <input type="text" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })}
                placeholder="Or paste image URL" style={{ flex: 1, ...inputStyle }} />
            </div>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>文章内容</h2>
          <RichEditor
            value={form.content}
            onChange={html => setForm({ ...form, content: html })}
            placeholder="开始撰写文章内容..."
            minHeight={500}
          />
        </div>

        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>SEO 设置</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Meta Title</label>
            <input type="text" value={form.metaTitle} onChange={e => setForm({ ...form, metaTitle: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Meta Description</label>
            <textarea value={form.metaDesc} onChange={e => setForm({ ...form, metaDesc: e.target.value })} rows={2} style={{ ...inputStyle, fontFamily: "inherit" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={saving}
            style={{ padding: "10px 24px", background: saving ? "#fbbf24" : "#d97706", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Create Post"}
          </button>
          <button type="button" onClick={() => router.back()}
            style={{ padding: "10px 24px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151",
};
