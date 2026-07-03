"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import BlockEditor from "@/components/admin/BlockEditor";
import { TemplateSelector } from "@/components/admin/TemplateSelector";
import SEOPanel from "@/components/admin/SEOPanel";

export default function NewPagePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    templateSlug: "default",
    content: "",
    metaTitle: "",
    metaDesc: "",
    targetKeyword: "",
  });

  function slugify(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/pages/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        templateSlug: form.templateSlug,
        published: true,
      }),
    });

    setSaving(false);
    if (res.ok) router.push("/admin/pages");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
    boxSizing: "border-box",
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        New Page
      </h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 1100 }}>
        {/* Page Info */}
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 16,
              color: "#374151",
            }}
          >
            页面信息
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={labelStyle}>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => {
                  setForm({
                    ...form,
                    title: e.target.value,
                    slug: slugify(e.target.value),
                  });
                }}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Template Selection */}
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 16,
              color: "#374151",
            }}
          >
            模板选择
          </h2>
          <TemplateSelector
            value={form.templateSlug}
            onChange={(slug) => setForm({ ...form, templateSlug: slug })}
          />
        </div>

        {/* Page Content - Block Editor */}
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 4,
              color: "#374151",
            }}
          >
            页面内容
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 16,
            }}
          >
            Drag-and-drop blocks to build your page. Hover over preview and click to edit.
          </p>
          <BlockEditor
            value={form.content}
            onChange={(json) => setForm({ ...form, content: json })}
          />
        </div>

        {/* SEO - Guided On-Page SEO Panel */}
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 12,
              color: "#374151",
            }}
          >
            🎯 On-Page SEO
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
            Fill out the checklist below to optimize this page.
          </p>
          <SEOPanel
            title={form.title}
            metaTitle={form.metaTitle}
            metaDesc={form.metaDesc}
            slug={form.slug}
            targetKeyword={form.targetKeyword}
            onMetaTitleChange={(v) => setForm({ ...form, metaTitle: v })}
            onMetaDescChange={(v) => setForm({ ...form, metaDesc: v })}
            onTargetKeywordChange={(v) => setForm({ ...form, targetKeyword: v })}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "10px 24px",
              background: saving ? "#6ee7b7" : "#059669",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Create Page"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: "10px 24px",
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 4,
  color: "#374151",
};
